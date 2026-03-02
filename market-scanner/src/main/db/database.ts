import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { CREATE_TABLES } from './schema';

// Wrapper that mimics the better-sqlite3 API using sql.js (WASM-based SQLite)
class StatementWrapper {
  constructor(
    private db: SqlJsDatabase,
    private sql: string,
    private onMutate: () => void,
  ) {}

  run(...params: any[]): { lastInsertRowid: number; changes: number } {
    this.db.run(this.sql, params);
    this.onMutate();
    const res = this.db.exec('SELECT last_insert_rowid() as id');
    return {
      lastInsertRowid: res.length > 0 ? Number(res[0].values[0][0]) : 0,
      changes: this.db.getRowsModified(),
    };
  }

  get(...params: any[]): any {
    const stmt = this.db.prepare(this.sql);
    if (params.length > 0) stmt.bind(params);
    let result: any = undefined;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  }

  all(...params: any[]): any[] {
    const stmt = this.db.prepare(this.sql);
    if (params.length > 0) stmt.bind(params);
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
}

class DatabaseWrapper {
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private db: SqlJsDatabase,
    private dbPath: string,
  ) {}

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveToDisk(), 500);
  }

  private saveToDisk(): void {
    try {
      const data = this.db.export();
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.dbPath, Buffer.from(data));
    } catch {
      // Ignore save errors during shutdown
    }
  }

  exec(sql: string): void {
    this.db.exec(sql);
    this.scheduleSave();
  }

  prepare(sql: string): StatementWrapper {
    return new StatementWrapper(this.db, sql, () => this.scheduleSave());
  }

  transaction<T>(fn: () => T): () => T {
    return () => {
      this.db.exec('BEGIN TRANSACTION');
      try {
        const result = fn();
        this.db.exec('COMMIT');
        this.scheduleSave();
        return result;
      } catch (err) {
        this.db.exec('ROLLBACK');
        throw err;
      }
    };
  }

  pragma(pragma: string): void {
    this.db.exec(`PRAGMA ${pragma}`);
  }

  close(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveToDisk();
    this.db.close();
  }
}

let db: DatabaseWrapper | null = null;
let initPromise: Promise<DatabaseWrapper> | null = null;

async function createDatabase(): Promise<DatabaseWrapper> {
  const SQL = await initSqlJs();
  const dbPath = path.join(app.getPath('userData'), 'market-scanner.db');

  let sqlDb: SqlJsDatabase;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  const wrapper = new DatabaseWrapper(sqlDb, dbPath);
  wrapper.pragma('foreign_keys = ON');
  wrapper.exec(CREATE_TABLES);
  return wrapper;
}

export async function initDb(): Promise<void> {
  if (!initPromise) {
    initPromise = createDatabase();
  }
  db = await initPromise;
}

export function getDatabase(): DatabaseWrapper {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    initPromise = null;
  }
}
