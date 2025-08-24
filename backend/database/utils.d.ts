import { Database } from 'sqlite';
import * as sqlite3 from 'sqlite3';
export declare class DatabaseUtils {
    static createConnection(dbPath?: string): Promise<Database<sqlite3.Database, sqlite3.Statement>>;
    static runMigrations(db: Database<sqlite3.Database, sqlite3.Statement>, migrationsDir?: string): Promise<void>;
    static backupDatabase(sourcePath: string, backupPath: string): Promise<void>;
    static checkDatabaseHealth(db: Database<sqlite3.Database, sqlite3.Statement>): Promise<boolean>;
    static getDatabaseStats(db: Database<sqlite3.Database, sqlite3.Statement>): Promise<Record<string, any>>;
}
//# sourceMappingURL=utils.d.ts.map