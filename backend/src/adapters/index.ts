/**
 * 数据库适配器模块导出
 */

// 接口定义
export * from './interfaces';

// 适配器实现
export { MySQLAdapter, MySQLDialect } from './MySQLAdapter';
export { PostgreSQLAdapter, PostgreSQLDialect } from './PostgreSQLAdapter';
export { SQLiteAdapter, SQLiteDialect } from './SQLiteAdapter';
export { MongoDBAdapter, MongoDBDialect } from './MongoDBAdapter';

// 适配器工厂
export { AdapterFactory } from './AdapterFactory';

/**
 * 支持的数据库类型常量
 */
export const SUPPORTED_DATABASE_TYPES = [
  'mysql',
  'postgresql', 
  'sqlite',
  'mongodb'
] as const;

/**
 * 数据库类型显示名称映射
 */
export const DATABASE_TYPE_LABELS = {
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  sqlite: 'SQLite',
  mongodb: 'MongoDB',
  redis: 'Redis',
  oracle: 'Oracle',
  sqlserver: 'SQL Server'
} as const;

/**
 * 数据库默认端口映射
 */
export const DATABASE_DEFAULT_PORTS = {
  mysql: 3306,
  postgresql: 5432,
  sqlite: 0, // 不使用端口
  mongodb: 27017,
  redis: 6379,
  oracle: 1521,
  sqlserver: 1433
} as const;

/**
 * 数据库特性支持矩阵
 */
export const DATABASE_FEATURES = {
  mysql: {
    transactions: true,
    fullTextSearch: true,
    jsonSupport: true,
    geoSpatial: true,
    partitioning: true,
    replication: true,
    clustering: true
  },
  postgresql: {
    transactions: true,
    fullTextSearch: true,
    jsonSupport: true,
    geoSpatial: true,
    partitioning: true,
    replication: true,
    clustering: true
  },
  sqlite: {
    transactions: true,
    fullTextSearch: true,
    jsonSupport: true,
    geoSpatial: false,
    partitioning: false,
    replication: false,
    clustering: false
  },
  mongodb: {
    transactions: true,
    fullTextSearch: true,
    jsonSupport: true,
    geoSpatial: true,
    partitioning: true,
    replication: true,
    clustering: true
  }
} as const;