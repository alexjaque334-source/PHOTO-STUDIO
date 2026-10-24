/**
 * In-memory D1 Database Mock utilizando SQLite nativo (node:sqlite).
 * Dono: Subagente 8 (QA e Testes).
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export interface MockD1Instance {
  d1: D1Database;
  sqlite: DatabaseSync;
}

export function createMockD1(): MockD1Instance {
  const db = new DatabaseSync(':memory:');

  // Carrega e aplica o schema canônico
  const migrationPath = path.resolve(__dirname, '../migrations/0001_init.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  db.exec(sql);
  db.exec('PRAGMA foreign_keys = OFF;');

  // Implementação de Prepared Statement compatível com Cloudflare D1
  class MockPreparedStatement {
    constructor(private query: string, private params: any[] = []) {}

    bind(...args: any[]): D1PreparedStatement {
      return new MockPreparedStatement(this.query, args) as unknown as D1PreparedStatement;
    }

    async first<T = Record<string, any>>(colName?: string): Promise<T | null> {
      const stmt = db.prepare(this.query);
      const row = stmt.get(...this.params) as Record<string, any> | undefined;
      if (!row) return null;
      if (colName) return (row[colName] ?? null) as T;
      return row as T;
    }

    async all<T = Record<string, any>>(): Promise<D1Result<T>> {
      const stmt = db.prepare(this.query);
      const rows = stmt.all(...this.params) as T[];
      return {
        results: rows,
        success: true,
        meta: {} as any,
      };
    }

    async run<T = Record<string, any>>(): Promise<D1Result<T>> {
      const stmt = db.prepare(this.query);
      const res = stmt.run(...this.params);
      return {
        results: [],
        success: true,
        meta: {
          changes: res.changes,
          last_row_id: Number(res.lastInsertRowid),
          duration: 0,
          rows_read: 0,
          rows_written: res.changes,
        } as any,
      };
    }

    async raw<T = unknown[]>(): Promise<any> {
      const stmt = db.prepare(this.query);
      return stmt.all(...this.params);
    }
  }

  const d1Mock: any = {
    prepare(query: string): D1PreparedStatement {
      return new MockPreparedStatement(query) as unknown as D1PreparedStatement;
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      db.exec('BEGIN TRANSACTION');
      const results: D1Result<T>[] = [];
      try {
        for (const s of statements) {
          const res = await s.run<T>();
          results.push(res);
        }
        db.exec('COMMIT');
        return results;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
    async exec(query: string): Promise<D1ExecResult> {
      db.exec(query);
      return { count: 1, duration: 0 };
    },
    dump(): Promise<ArrayBuffer> {
      throw new Error('Not implemented in mock');
    },
    withSession(): any {
      return d1Mock;
    },
  };

  return { d1: d1Mock as D1Database, sqlite: db };
}
