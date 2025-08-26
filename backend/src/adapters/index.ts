/**
 * 数据库适配器模块导出
 */

// 接口定义
export * from './interfaces';

// 适配器实现（仅支持PostgreSQL和MongoDB）
export { PostgreSQLAdapter, PostgreSQLDialect } from './PostgreSQLAdapter';
export { MongoDBAdapter, MongoDBDialect } from './MongoDBAdapter';

// 适配器工厂
export { AdapterFactory } from './AdapterFactory';

/**
 * 支持的数据库类型常量
 */
export const SUPPORTED_DATABASE_TYPES = [
  'postgresql', 
  'mongodb'
] as const;

/**
 * 数据库类型显示名称映射
 */
export const DATABASE_TYPE_LABELS = {
  postgresql: 'PostgreSQL (支持向量搜索)',
  mongodb: 'MongoDB (支持文档搜索)'
} as const;

/**
 * 数据库默认端口映射
 */
export const DATABASE_DEFAULT_PORTS = {
  postgresql: 5432,
  mongodb: 27017
} as const;

/**
 * AI语义化功能支持矩阵
 */
export const AI_DATABASE_FEATURES = {
  postgresql: {
    transactions: true,
    fullTextSearch: true,
    vectorSearch: true, // pgvector扩展
    semanticAnalysis: true,
    intelligentJoin: true,
    dataStatistics: true,
    jsonSupport: true,
    geoSpatial: true,
    aiOptimization: true
  },
  mongodb: {
    transactions: true,
    fullTextSearch: true,
    vectorSearch: true, // Atlas Vector Search
    semanticAnalysis: true,
    intelligentJoin: true, // 聚合查询
    dataStatistics: true,
    documentAnalysis: true,
    flexibleSchema: true,
    aiOptimization: true
  }
} as const;