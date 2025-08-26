import { databaseManager } from '../config/database';

/**
 * 服务基类 - 提供统一的数据库访问方式和服务单例模式
 * 
 * @description 所有业务服务类都应该继承此类，以获得统一的数据库访问和单例模式支持
 * @author AI数据库团队
 * @version 1.0.0
 */
export abstract class BaseService {
  private static instances: Map<string, BaseService> = new Map();
  
  /**
   * 获取数据库实例
   */
  protected async getDatabase(): Promise<any> {
    return databaseManager.getDatabase();
  }
  
  /**
   * 获取服务单例实例（基类方法，子类可以重写）
   */
  static getBaseInstance<T extends BaseService>(this: new() => T): T {
    const className = this.name;
    if (!BaseService.instances.has(className)) {
      BaseService.instances.set(className, new this());
    }
    return BaseService.instances.get(className) as T;
  }
  
  /**
   * 执行查询语句，返回单个结果
   */
  protected async executeQuery<T = any>(
    sql: string, 
    params?: any[]
  ): Promise<T> {
    const db = await this.getDatabase();
    return db.get(sql, params) as Promise<T>;
  }
  
  /**
   * 执行查询语句，返回所有结果
   */
  protected async executeAll<T = any>(
    sql: string, 
    params?: any[]
  ): Promise<T[]> {
    const db = await this.getDatabase();
    return db.all(sql, params) as Promise<T[]>;
  }
  
  /**
   * 执行插入、更新或删除语句
   */
  protected async executeRun(
    sql: string, 
    params?: any[]
  ): Promise<any> {
    const db = await this.getDatabase();
    return db.run(sql, params);
  }
}