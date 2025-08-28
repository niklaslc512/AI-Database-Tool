import { v4 as uuidv4 } from 'uuid'
import { BaseService } from './BaseService'
import { 
  AIConversationMessage, 
  CreateAIConversationMessageRequest,
  AIConversationHistoryParams,
  SQLExecuteLog,
  CreateSQLExecuteLogRequest
} from '../types'
import { logger } from '../utils/logger'

/**
 * 🤖 AI对话服务类
 * 管理AI对话记录的CRUD操作
 */
export class AIConversationService extends BaseService {
  constructor() {
    super()
  }

  /**
   * 📝 创建AI对话消息记录
   * @param request 创建请求参数
   * @returns Promise<AIConversationMessage> 创建的消息记录
   */
  async createMessage(request: CreateAIConversationMessageRequest): Promise<AIConversationMessage> {
    try {
      const messageId = uuidv4()
      const now = new Date()
      
      // 🔄 将token_cost和metadata转换为JSON字符串
      const tokenCostJson = request.token_cost ? JSON.stringify(request.token_cost) : null
      const metadataJson = request.metadata ? JSON.stringify(request.metadata) : null

      const sql = `
        INSERT INTO ai_conversations (
          id, conversation_id, user_id, database_connection_id, 
          role, content, token_cost, model, response_time, 
          status, error_message, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      const params = [
        messageId,
        request.conversation_id,
        request.user_id,
        request.database_connection_id,
        request.role,
        request.content,
        tokenCostJson,
        request.model || null,
        request.response_time || null,
        request.status || 'success',
        request.error_message || null,
        metadataJson,
        now.toISOString()
      ]

      await this.executeRun(sql, params)

      logger.info('✅ AI对话消息创建成功', {
        messageId,
        conversationId: request.conversation_id,
        role: request.role
      })

      // 🔍 返回创建的消息记录
      return {
        id: messageId,
        conversation_id: request.conversation_id || "",
        user_id: request.user_id,
        database_connection_id: request.database_connection_id,
        role: request.role,
        content: request.content,
        token_cost: tokenCostJson || null,
        model: request.model || "",
        response_time: request.response_time || 0,
        status: request.status || 'success',
        error_message: request.error_message || "",
        metadata: metadataJson || "",
        created_at: now
      }

    } catch (error) {
      logger.error('❌ 创建AI对话消息失败', {
        error: error instanceof Error ? error.message : String(error),
        conversationId: request.conversation_id
      })
      throw error
    }
  }

  /**
   * 📚 获取对话历史消息
   * @param params 查询参数
   * @returns Promise<AIConversationMessage[]> 历史消息列表
   */
  async getConversationHistory(params: AIConversationHistoryParams): Promise<AIConversationMessage[]> {
    try {
      let sql = `
        SELECT id, conversation_id, user_id, database_connection_id,
               role, content, token_cost, model, response_time,
               status, error_message, metadata, created_at
        FROM ai_conversations 
        WHERE conversation_id = ?
      `
      const queryParams: any[] = [params.conversation_id]

      // 🔍 如果指定了status，添加状态过滤条件
      if (params.status) {
        sql += ` AND status = ?`
        queryParams.push(params.status)
      }

      // 🔍 如果指定了before_message_id，添加时间过滤条件
      if (params.before_message_id) {
        sql += ` AND created_at < (
          SELECT created_at FROM ai_conversations WHERE id = ?
        )`
        queryParams.push(params.before_message_id)
      }

      sql += ` ORDER BY created_at ASC`

      // 🔢 添加限制条数
      if (params.limit && params.limit > 0) {
        sql += ` LIMIT ?`
        queryParams.push(params.limit)
      }

      const result = await this.executeAll(sql, queryParams)

      const messages: AIConversationMessage[] = result.map((row: any) => ({
        id: row.id,
        conversation_id: row.conversation_id,
        user_id: row.user_id,
        database_connection_id: row.database_connection_id,
        role: row.role,
        content: row.content,
        token_cost: row.token_cost,
        model: row.model,
        response_time: row.response_time,
        status: row.status,
        error_message: row.error_message,
        metadata: row.metadata,
        created_at: new Date(row.created_at)
      }))

      logger.info('📚 获取对话历史成功', {
        conversationId: params.conversation_id,
        messageCount: messages.length,
        limit: params.limit
      })

      return messages

    } catch (error) {
      logger.error('❌ 获取对话历史失败', {
        error: error instanceof Error ? error.message : String(error),
        conversationId: params.conversation_id
      })
      throw error
    }
  }

  /**
   * 🔄 更新消息状态
   * @param messageId 消息ID
   * @param status 新状态
   * @returns Promise<void>
   */
  async updateMessageStatus(messageId: string, status: 'success' | 'error' | 'pending'): Promise<void> {
    try {
      logger.info('🔄 开始更新消息状态', {
        messageId,
        status
      })

      // 移除 updated_at 字段，因为 ai_conversations 表中没有这个字段
      const sql = `UPDATE ai_conversations SET status = ? WHERE id = ?`
      const result = await this.executeRun(sql, [status, messageId])

      logger.info('🔄 消息状态更新成功', {
        messageId,
        status,
        affectedRows: result.changes || 0
      })

      // 如果没有更新任何行，记录警告
      if ((result.changes || 0) === 0) {
        logger.warn('⚠️ 消息状态更新未影响任何行', {
          messageId,
          status
        })
      }

    } catch (error) {
      logger.error('❌ 更新消息状态失败', {
        error: error instanceof Error ? error.message : String(error),
        messageId,
        status,
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }

  /**
   * 🗑️ 删除对话记录
   * @param conversationId 对话ID
   * @returns Promise<number> 删除的记录数
   */
  async deleteConversation(conversationId: string): Promise<number> {
    try {
      const sql = `DELETE FROM ai_conversations WHERE conversation_id = ?`
      const result = await this.executeRun(sql, [conversationId])

      logger.info('🗑️ 对话记录删除成功', {
        conversationId,
        deletedCount: result.affectedRows || 0
      })

      return result.changes || 0

    } catch (error) {
      logger.error('❌ 删除对话记录失败', {
        error: error instanceof Error ? error.message : String(error),
        conversationId
      })
      throw error
    }
  }

  /**
   * 📊 创建SQL执行日志
   * @param request 创建请求参数
   * @returns Promise<SQLExecuteLog> 创建的日志记录
   */
  async createSQLExecuteLog(request: CreateSQLExecuteLogRequest): Promise<SQLExecuteLog> {
    try {
      const logId = uuidv4()
      const now = new Date()
      
      // 🔄 将result_preview转换为JSON字符串
      const resultPreviewJson = request.result_preview ? JSON.stringify(request.result_preview) : null

      const sql = `
        INSERT INTO sql_execute_logs (
          id, user_id, database_connection_id, conversation_id,
          sql_query, execution_time, rows_affected, status,
          error_message, result_preview, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      const params = [
        logId,
        request.user_id,
        request.database_connection_id,
        request.conversation_id || null,
        request.sql_query,
        request.execution_time,
        request.rows_affected || null,
        request.status,
        request.error_message || null,
        resultPreviewJson,
        now.toISOString()
      ]

      await this.executeRun(sql, params)

      logger.info('📊 SQL执行日志创建成功', {
        logId,
        conversationId: request.conversation_id,
        status: request.status
      })

      // 🔍 返回创建的日志记录
      return {
        id: logId,
        user_id: request.user_id,
        database_connection_id: request.database_connection_id,
        conversation_id: request.conversation_id || "",
        sql_query: request.sql_query,
        execution_time: request.execution_time,
        rows_affected: request.rows_affected || 0,
        status: request.status,
        error_message: request.error_message || "",
        result_preview: resultPreviewJson || null,
        created_at: now
      }

    } catch (error) {
      logger.error('❌ 创建SQL执行日志失败', {
        error: error instanceof Error ? error.message : String(error),
        conversationId: request.conversation_id
      })
      throw error
    }
  }

  /**
   * 📈 获取对话统计信息
   * @param conversationId 对话ID
   * @returns Promise<object> 统计信息
   */
  async getConversationStats(conversationId: string): Promise<{
    messageCount: number
    totalTokens: number
    totalCost: number
    avgResponseTime: number
  }> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as message_count,
          AVG(response_time) as avg_response_time
        FROM ai_conversations 
        WHERE conversation_id = ? AND status = 'success'
      `

      const result = await this.executeQuery(sql, [conversationId])
      const stats = result || {}

      // 🔍 计算token和成本统计（需要解析JSON字段）
      const tokenSql = `
        SELECT token_cost 
        FROM ai_conversations 
        WHERE conversation_id = ? AND token_cost IS NOT NULL
      `
      const tokenResult = await this.executeAll(tokenSql, [conversationId])
      
      let totalTokens = 0
      let totalCost = 0
      
      tokenResult.forEach((row: any) => {
        try {
          const tokenData = JSON.parse(row.token_cost)
          totalTokens += tokenData.total_tokens || 0
          totalCost += tokenData.cost_usd || 0
        } catch (e) {
          // 忽略解析错误
        }
      })

      return {
        messageCount: parseInt(stats.message_count) || 0,
        totalTokens,
        totalCost,
        avgResponseTime: parseFloat(stats.avg_response_time) || 0
      }

    } catch (error) {
      logger.error('❌ 获取对话统计失败', {
        error: error instanceof Error ? error.message : String(error),
        conversationId
      })
      throw error
    }
  }
}

// 🌟 导出单例实例
export const aiConversationService = new AIConversationService()