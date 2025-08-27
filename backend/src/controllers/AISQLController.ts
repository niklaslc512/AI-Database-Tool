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
    // 🔧 初始化OpenAI客户端
    this.openai = new OpenAI({
      apiKey: process.env.AI_LLM_API_KEY as string,
      baseURL: process.env.AI_LLM_BASE_URL
    });
  }

  /**
   * 🗣️ 处理AI驱动的SQL查询对话
   */
  async chat(req: Request, res: Response): Promise<void> {
    try {
      const dbId = req.params.dbId as string
      const { message, conversation_id } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('用户未认证', 401);
      }

      if (!message) {
        throw new AppError('消息内容不能为空', 400);
      }

      // 🔍 验证数据库连接是否存在
      const userConnections = await DatabaseService.getUserConnections(userId);
      const connection = userConnections.find(conn => conn.id === dbId);
      if (!connection) {
        throw new AppError('数据库连接不存在', 404);
      }

      // 生成对话ID（如果没有提供）
      const actualConversationId = conversation_id || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 获取历史消息（只获取成功的消息）
      const historyLimit = await ConfigService.getInstance().getConfigValue<number>('ai_conversation_max_history_messages') || 10;
      const historyMessages = await this.aiConversationService.getConversationHistory({
        conversation_id: actualConversationId,
        limit: historyLimit,
        status: 'success'
      });

      // 保存用户消息（初始状态为pending）
      const userMessage = await this.aiConversationService.createMessage({
        conversation_id: actualConversationId,
        user_id: userId,
        database_connection_id: dbId,
        role: 'user',
        content: message,
        status: 'pending'
      });

      // 🤖 调用AI服务生成SQL
      const startTime = Date.now();
      
      // 🔍 构建提示词
      const systemPrompt = Prompt.getDatabaseManagerSystemPrompt({
        databaseType: connection.type || '',
        databaseName: connection.name || ''
      });

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

      // 🤖 调用AI模型生成SQL
      const completion = await this.openai.chat.completions.create({
        model: (process.env.AI_LLM_MODEL as string) || 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.1,
        max_tokens: 2048,
        top_p: 0.9
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('AI模型未返回有效响应');
      }

      // 🔍 解析AI响应中的JSON结构
      const aiResult = this.parseAIResponse(aiResponse);
      const responseTime = Date.now() - startTime;

      // 保存AI响应消息
      await this.aiConversationService.createMessage({
        conversation_id: actualConversationId,
        user_id: userId,
        database_connection_id: dbId,
        role: 'assistant',
        content: aiResult.reply,
        model: await ConfigService.getInstance().getConfigValue<string>('ai_conversation_default_model') || 'gpt-3.5-turbo',
        response_time: responseTime,
        status: 'success',
        metadata: {
          generated_sql: aiResult.sql
        }
      });

      // 更新用户消息状态为成功
      await this.aiConversationService.updateMessageStatus(userMessage.id, 'success');

      res.json({
        conversation_id: actualConversationId,
        sql: aiResult.sql,
        reply: aiResult.reply,
        response_time: responseTime
      });

    } catch (error) {
      logger.error('AI SQL对话处理失败:', error);
      
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
      // 🔍 查找<回答>标签内的JSON内容
      const answerMatch = aiResponse.match(/<回答>\s*([\s\S]*?)\s*<\/回答>/);
      if (!answerMatch || !answerMatch[1]) {
        throw new Error('AI响应中未找到<回答>标签或内容为空');
      }

      const jsonStr = answerMatch[1].trim();
      const parsed = JSON.parse(jsonStr) as { sql?: string; reply?: string };

      if (!parsed || typeof parsed !== 'object' || !parsed.sql || !parsed.reply) {
        throw new Error('AI响应JSON格式不完整，缺少sql或reply字段');
      }

      return {
        sql: parsed.sql.trim(),
        reply: parsed.reply.trim()
      };

    } catch (error) {
      logger.error('❌ 解析AI响应失败', error);
      
      // 🔄 如果解析失败，尝试直接返回原始响应
      return {
        sql: '',
        reply: `解析AI响应失败: ${error instanceof Error ? error.message : String(error)}\n\n原始响应:\n${aiResponse}`
      };
    }
  }
}