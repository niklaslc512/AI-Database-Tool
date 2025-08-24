import { Database } from 'sqlite';
import * as sqlite3 from 'sqlite3';
declare function initializeDatabase(): Promise<void>;
declare function initializeUsers(db: Database<sqlite3.Database, sqlite3.Statement>): Promise<void>;
export { initializeDatabase, initializeUsers };
//# sourceMappingURL=init-database.d.ts.map