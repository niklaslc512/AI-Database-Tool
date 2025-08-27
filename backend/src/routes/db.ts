import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../middleware/auth';
import { DatabaseService } from '../services/DatabaseService';
import { AISQLController } from '../controllers/AISQLController';
import { aiConversationService } from '../services/AIConversationService';
import { logger } from '../utils/logger';
import { TableInfo, ColumnInfo } from '../types';

/**
 * 🗄️ 数据库操作路由
 * 提供数据库表和字段信息查询功能
 */
export function createDatabaseRoutes(): Router {
    const router = Router();
    const authMiddleware = new AuthMiddleware();
    const aiSQLController = new AISQLController();

    /**
     * 📋 获取数据库中所有表的信息
     * GET /:dbId/tables
     * 
     * @param dbId 数据库连接ID
     * @returns 表列表及其字段信息
     */
    router.get(
        '/:dbId/tables',
        authMiddleware.authenticate,
        authMiddleware.requireRole(['developer']),
        async (req: Request, res: Response): Promise<void> => {
            try {
                const { dbId } = req.params;

                // 🔍 验证参数
                if (!dbId) {
                    res.status(400).json({
                        message: '数据库连接ID不能为空'
                    });
                    return
                }

                logger.info(`🔍 获取数据库表信息: ${dbId}`);

                // 🗂️ 获取所有表的基本信息
                const tables: TableInfo[] = await DatabaseService.getTables(dbId);

                // 📊 为每个表获取详细的字段信息
                const tablesWithColumns = await Promise.all(
                    tables.map(async (table) => {
                        try {
                            const columns: ColumnInfo[] = await DatabaseService.getTableSchema(dbId, table.name);

                            return {
                                name: table.name,
                                type: table.type,
                                rowCount: table.rowCount,
                                size: table.size,
                                comment: table.comment,
                                schema: table.schema,
                                columns: columns.map(col => ({
                                    name: col.name,
                                    type: col.type,
                                    nullable: col.nullable,
                                    isPrimaryKey: col.isPrimaryKey,
                                    isAutoIncrement: col.isAutoIncrement,
                                    defaultValue: col.defaultValue,
                                    maxLength: col.maxLength,
                                    precision: col.precision,
                                    scale: col.scale,
                                    comment: col.comment || ''
                                }))
                            };
                        } catch (error) {
                            logger.warn(`⚠️ 获取表 ${table.name} 字段信息失败:`, error);
                            return {
                                name: table.name,
                                type: table.type,
                                rowCount: table.rowCount,
                                size: table.size,
                                comment: table.comment,
                                schema: table.schema,
                                columns: [],
                                error: '无法获取字段信息'
                            };
                        }
                    })
                );

                logger.info(`✅ 成功获取 ${tables.length} 个表的信息`);

                res.json({
                    connectionId: dbId,
                    tableCount: tables.length,
                    tables: tablesWithColumns
                });

            } catch (error) {
                logger.error(`❌ 获取数据库表信息失败 [${req.params.dbId}]:`, error);

                res.status(500).json({
                    message: '获取数据库表信息失败',
                    error: error instanceof Error ? error.message : '未知错误'
                });
            }
        }
    );

    /**
     * 🤖 执行AI驱动的SQL查询对话
     * POST /:dbId/chat
     * 
     * @param dbId 数据库连接ID
     * @body message 用户输入的自然语言查询
     * @body conversationId 对话ID
     * @body maxHistoryMessages 最大历史消息数量（可选）
     * @returns AI生成的SQL语句和回复
     */
    router.post("/:dbId/chat",
        authMiddleware.authenticate,
        authMiddleware.requireRole(['developer']),
        async (req: Request, res: Response): Promise<void> => {
            // 🔄 将dbId添加到请求体中，供控制器使用
            req.body.databaseConnectionId = req.params.dbId;
            
            // 🤖 调用AISQLController的chat方法
            await aiSQLController.chat(req, res);
        }
    );

    /**
     * 🔍 执行SQL查询
     * POST /:dbId/query
     * 
     * @param dbId 数据库连接ID
     * @body sql SQL查询语句
     * @body conversation_id 对话ID（可选）
     * @returns 查询结果和执行信息
     */
    router.post("/:dbId/query",
        authMiddleware.authenticate,
        authMiddleware.requireRole(['developer']),
        async (req: Request, res: Response): Promise<void> => {
            try {
                const dbId = req.params.dbId as string;
                const { sql, conversation_id } = req.body;
                const userId = req.user?.id;

                if (!userId) {
                    res.status(401).json({ message: '用户未认证' });
                    return;
                }

                if (!sql) {
                    res.status(400).json({ message: 'SQL语句不能为空' });
                    return;
                }

                // 🔍 验证数据库连接是否存在
                const userConnections = await DatabaseService.getUserConnections(userId);
                const connection = userConnections.find(conn => conn.id === dbId);
                if (!connection) {
                    res.status(404).json({ message: '数据库连接不存在' });
                    return;
                }

                // ⏱️ 记录开始时间
                const startTime = Date.now();
                let result: any;
                let status: 'success' | 'error' = 'success';
                let errorMessage: string | undefined;
                let rowsAffected = 0;

                try {
                    // 🚀 执行SQL查询
                    result = await DatabaseService.executeQuery(dbId, sql);
                    rowsAffected = result.rowCount || result.affectedRows || 0;
                    
                    logger.info('✅ SQL查询执行成功', {
                        dbId,
                        userId,
                        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
                        rowsAffected,
                        executionTime: Date.now() - startTime
                    });

                } catch (error) {
                    status = 'error';
                    errorMessage = error instanceof Error ? error.message : String(error);
                    
                    logger.error('❌ SQL查询执行失败', {
                        dbId,
                        userId,
                        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
                        error: errorMessage,
                        executionTime: Date.now() - startTime
                    });
                }

                const executionTime = Date.now() - startTime;

                 // 📊 记录SQL执行日志
                 try {
                     const logRequest: any = {
                         user_id: userId,
                         database_connection_id: dbId,
                         sql_query: sql,
                         execution_time: executionTime,
                         rows_affected: rowsAffected,
                         status,
                         result_preview: status === 'success' && result?.rows ? result.rows.slice(0, 10) : undefined
                     };
                     
                     if (conversation_id) {
                         logRequest.conversation_id = conversation_id;
                     }
                     
                     if (errorMessage) {
                         logRequest.error_message = errorMessage;
                     }
                     
                     await aiConversationService.createSQLExecuteLog(logRequest);
                 } catch (logError) {
                     logger.error('❌ SQL执行日志记录失败', {
                         error: logError instanceof Error ? logError.message : String(logError)
                     });
                 }

                 // 🔄 返回响应
                if (status === 'error') {
                    res.status(400).json({
                        message: '查询执行失败',
                        error: errorMessage,
                        execution_time: executionTime
                    });
                    return;
                }

                res.json({
                    success: true,
                    data: result?.rows || result?.data || [],
                    rows_affected: rowsAffected,
                    execution_time: executionTime,
                    columns: result?.fields || result?.columns || []
                });

            } catch (error) {
                logger.error('💥 SQL查询路由处理失败:', error);
                res.status(500).json({ message: '服务器内部错误' });
            }
        }
    );

    return router;
}