import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { AIConversationService } from '../services/AIConversationService';
import { ConfigService } from '../services/ConfigService';
import OpenAI from 'openai';
import { Prompt } from '../config/prompt';
import { logger } from '../utils/logger';
import { AppError } from '../types';
import type { AIConversationHistoryParams } from '../types';

/**
 * 🤖 AI SQL控制器
 * 处理AI驱动的SQL查询对话请求
 */
export class AISQLController {
  private aiConversationService: AIConversationService;
  private openai: OpenAI;

  constructor() {
    this.aiConversationService = new AIConversationService();
    // 🔧 初始化OpenAI客户端，设置更长的超时时间
    this.openai = new OpenAI({
      apiKey: process.env.AI_LLM_API_KEY as string,
      baseURL: process.env.AI_LLM_BASE_URL,
      // timeout: 120000, // 🤖 设置2分钟超时，匹配前端设置
      // maxRetries: 2 // 🔄 设置重试次数
    });
  }

  /**
   * 🗣️ 处理AI驱动的SQL查询对话
   */
  async chat(req: Request, res: Response): Promise<void> {
    let userMessage: any = null;
    let actualConversationId: string = '';
    try {
      const dbId = req.params.dbId as string
      const { message, conversation_id } = req.body;
      const userId = req.user?.id;

      logger.info('🗣️ 开始处理AI对话请求', {
        dbId,
        userId,
        messageLength: message?.length || 0,
        conversationId: conversation_id
      });

      if (!userId) {
        throw new AppError('用户未认证', 401);
      }

      if (!message) {
        throw new AppError('消息内容不能为空', 400);
      }

      // 🔍 验证数据库连接是否存在
      logger.info('🔍 验证数据库连接', { dbId, userId });
      const userConnections = await DatabaseService.getUserConnections(userId);
      const connection = userConnections.find(conn => conn.id === dbId);
      if (!connection) {
        logger.error('❌ 数据库连接不存在', { dbId, userId, availableConnections: userConnections.length });
        throw new AppError('数据库连接不存在', 404);
      }
      logger.info('✅ 数据库连接验证成功', { dbId, connectionName: connection.name, connectionType: connection.type });

      // 生成对话ID（如果没有提供）
      actualConversationId = conversation_id || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      logger.info('📝 对话ID确定', { conversationId: actualConversationId, isNew: !conversation_id });

      // 获取历史消息（只获取成功的消息）
      const historyLimit = await ConfigService.getInstance().getConfigValue<number>('ai_conversation_max_history_messages') || 10;
      logger.info('📚 开始获取历史消息', { conversationId: actualConversationId, historyLimit });
      const historyMessages = await this.aiConversationService.getConversationHistory({
        conversation_id: actualConversationId,
        limit: historyLimit,
        status: 'success'
      });
      logger.info('📚 历史消息获取完成', { conversationId: actualConversationId, messageCount: historyMessages.length });

      // 保存用户消息（初始状态为pending）
      logger.info('💾 开始保存用户消息', { conversationId: actualConversationId, messageLength: message.length });
      userMessage = await this.aiConversationService.createMessage({
        conversation_id: actualConversationId,
        user_id: userId,
        database_connection_id: dbId,
        role: 'user',
        content: message,
        status: 'pending'
      });
      logger.info('💾 用户消息保存成功', { messageId: userMessage.id, conversationId: actualConversationId });

      // 🤖 调用AI服务生成SQL
      const startTime = Date.now();
      logger.info('🤖 开始调用AI服务', { conversationId: actualConversationId, startTime });
      
      // 🔍 构建提示词
      const systemPrompt = Prompt.getDatabaseManagerSystemPrompt({
        databaseType: connection.type || '',
        databaseName: connection.name || ''
      });
      logger.info('🔍 系统提示词构建完成', { databaseType: connection.type, databaseName: connection.name });

      const messages: any[] = [
        {
          role: 'system',
          content: systemPrompt
        }
      ];

      // 添加历史消息
      historyMessages.forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
      });

      messages.push({
        role: 'user',
        content: message
      });
      logger.info('📝 消息列表构建完成', { totalMessages: messages.length, historyCount: historyMessages.length });

      // 🤖 调用AI模型生成SQL
      const model = (process.env.AI_LLM_MODEL as string) || 'gpt-3.5-turbo';
      logger.info('🤖 开始调用OpenAI API', { model, messageCount: messages.length });
      
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: 0.1,
        max_tokens: 2048,
        thinking: {
          type: "disabled",
        },
        top_p: 0.9,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sql_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                sql: {
                  type: "string",
                  description: "要执行的SQL语句"
                },
                reply: {
                  type: "string",
                  description: "该SQL语句执行可能产生的结果说明"
                }
              },
              required: ["sql", "reply"],
              additionalProperties: false
            }
          }
        }
      } as any);
      logger.info('🤖 OpenAI API调用完成', { model, usage: completion.usage });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        logger.error('❌ AI模型未返回有效响应', { completion: completion.choices });
        throw new Error('AI模型未返回有效响应');
      }
      logger.info('✅ AI响应获取成功', { responseLength: aiResponse.length });

      // 🔍 解析AI响应中的JSON结构
      logger.info('🔍 开始解析AI响应');
      const aiResult = this.parseAIResponse(aiResponse);
      const responseTime = Date.now() - startTime;
      logger.info('🔍 AI响应解析完成', { responseTime, hasSql: !!aiResult.sql, replyLength: aiResult.reply?.length || 0 });

      // 💰 准备token使用情况信息
      const tokenCost = completion.usage ? {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens
      } : undefined;
      
      // 保存AI响应消息
      logger.info('💾 开始保存AI响应消息', { conversationId: actualConversationId, responseTime, tokenCost });
      await this.aiConversationService.createMessage({
        conversation_id: actualConversationId,
        user_id: userId,
        database_connection_id: dbId,
        role: 'assistant',
        content: aiResult.reply,
        model: await ConfigService.getInstance().getConfigValue<string>('ai_conversation_default_model') || model,
        response_time: responseTime,
        status: 'success',
        token_cost: tokenCost,
        metadata: {
          generated_sql: aiResult.sql
        }
      });
      logger.info('💾 AI响应消息保存成功', { conversationId: actualConversationId, tokenUsage: tokenCost });

      // 更新用户消息状态为成功
      logger.info('🔄 开始更新用户消息状态为成功', { messageId: userMessage.id });
      await this.aiConversationService.updateMessageStatus(userMessage.id, 'success');
      logger.info('🔄 用户消息状态更新完成', { messageId: userMessage.id });

      logger.info('✅ AI对话处理完成', { 
        conversationId: actualConversationId, 
        responseTime, 
        sqlGenerated: !!aiResult.sql 
      });

      res.json({
        conversation_id: actualConversationId,
        sql: aiResult.sql,
        reply: aiResult.reply,
        response_time: responseTime
      });

    } catch (error) {
      // 🔍 详细记录错误信息
      const errorDetails = {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        conversationId: actualConversationId || 'unknown',
        dbId: req.params.dbId,
        userId: req.user?.id,
        userMessageId: userMessage?.id,
        // 🔍 添加更多错误上下文
        errorType: error?.constructor?.name,
        errorCode: (error as any)?.code,
        errorStatus: (error as any)?.status,
        errorResponse: (error as any)?.response?.data
      };
      
      logger.error('❌ AI对话处理失败:', errorDetails);
      
      // 🔍 如果是OpenAI API错误，记录更详细信息
      if ((error as any)?.response) {
        logger.error('🔍 OpenAI API错误详情:', {
          status: (error as any).response.status,
          statusText: (error as any).response.statusText,
          data: (error as any).response.data,
          headers: (error as any).response.headers
        });
      }
      
      // 如果用户消息已创建，更新其状态为失败
      if (userMessage?.id) {
        try {
          logger.info('🔄 开始更新用户消息状态为错误', { messageId: userMessage.id });
          await this.aiConversationService.updateMessageStatus(userMessage.id, 'error');
          logger.info('🔄 用户消息状态更新为错误完成', { messageId: userMessage.id });
        } catch (updateError) {
          logger.error('❌ 更新用户消息状态失败:', {
            updateError: updateError instanceof Error ? updateError.message : String(updateError),
            stack: updateError instanceof Error ? updateError.stack : undefined,
            messageId: userMessage.id
          });
        }
      }
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: '服务器内部错误' });
      }
    }
  }

  /**
   * 📜 获取对话历史
   */
  async getConversationHistory(req: Request, res: Response): Promise<void> {
    try {
      const { conversation_id } = req.params;
      const { limit = 50, before_message_id } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('用户未认证', 401);
      }

      const historyParams: AIConversationHistoryParams = {
        conversation_id: conversation_id as string,
        limit: Number(limit),
        ...(before_message_id && { before_message_id: String(before_message_id) })
      };

      const messages = await this.aiConversationService.getConversationHistory(historyParams);

      res.json({
        conversation_id,
        messages,
        total: messages.length
      });

    } catch (error) {
      logger.error('获取对话历史失败:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: '服务器内部错误' });
      }
    }
  }



  /**
   * 🔍 解析AI响应中的JSON结构
   */
  private parseAIResponse(aiResponse: string): { sql: string; reply: string } {
    try {
      // 🔍 使用结构化输出，直接解析JSON响应
      const parsed = JSON.parse(aiResponse) as { sql?: string; reply?: string };

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('AI响应JSON格式不完整');
      }

      return {
        sql: parsed.sql ? parsed.sql.trim() : '',
        reply: parsed.reply ? parsed.reply.trim() : ''
      };

    } catch (error) {
      logger.error('❌ 解析AI响应失败', error);
      
      // 🔄 如果解析失败，返回错误信息
      return {
        sql: '',
        reply: `解析AI响应失败: ${error instanceof Error ? error.message : String(error)}\n\n原始响应:\n${aiResponse}`
      };
    }
  }
}