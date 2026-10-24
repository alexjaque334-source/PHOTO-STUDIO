/**
 * Helpers tipados para Cloudflare D1.
 * Dono: Backend Engineer
 */

export interface CursorPayload {
  id: string;
  sortValue?: string | number | null;
}

export function encodeCursor(payload: CursorPayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const binary = atob(cursor);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed.id === 'string') {
      return parsed as CursorPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function queryOne<T = Record<string, unknown>>(
  db: D1Database,
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const stmt = db.prepare(sql).bind(...params);
  const result = await stmt.first<T>();
  return result ?? null;
}

export async function queryAll<T = Record<string, unknown>>(
  db: D1Database,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const stmt = db.prepare(sql).bind(...params);
  const result = await stmt.all<T>();
  return result.results ?? [];
}

export async function execute(
  db: D1Database,
  sql: string,
  params: unknown[] = [],
): Promise<D1Result> {
  const stmt = db.prepare(sql).bind(...params);
  return stmt.run();
}

export async function batch(
  db: D1Database,
  statements: D1PreparedStatement[],
): Promise<D1Result[]> {
  if (statements.length === 0) return [];
  return db.batch(statements);
}

export interface PaginateOptions {
  table: string;
  select?: string;
  whereClause?: string;
  params?: unknown[];
  sortColumn?: string;
  order?: 'ASC' | 'DESC';
  cursor?: string | null;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Paginação segura baseada em cursor para tabelas D1.
 * Garante ordenação estável e previne duplicação com cursor composto (sortColumn, id).
 */
export async function paginate<T extends { id: string }>(
  db: D1Database,
  options: PaginateOptions,
): Promise<PaginatedResult<T>> {
  const {
    table,
    select = '*',
    whereClause = '1=1',
    params = [],
    sortColumn = 'created_at',
    order = 'DESC',
    cursor = null,
    limit = 20,
  } = options;

  const safeLimit = Math.max(1, Math.min(limit, 50));
  const queryParams = [...params];
  let cursorCondition = '';

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      const op = order === 'DESC' ? '<' : '>';
      if (sortColumn === 'id') {
        cursorCondition = ` AND id ${op} ?`;
        queryParams.push(decoded.id);
      } else {
        cursorCondition = ` AND (${sortColumn} ${op} ? OR (${sortColumn} = ? AND id ${op} ?))`;
        queryParams.push(decoded.sortValue ?? '', decoded.sortValue ?? '', decoded.id);
      }
    }
  }

  // Buscamos 1 item a mais para saber se há próxima página
  const sql = `
    SELECT ${select} FROM ${table}
    WHERE ${whereClause} ${cursorCondition}
    ORDER BY ${sortColumn} ${order}, id ${order}
    LIMIT ${safeLimit + 1}
  `;

  const rows = await queryAll<T>(db, sql, queryParams);

  let nextCursor: string | null = null;
  if (rows.length > safeLimit) {
    const lastItem = rows[safeLimit - 1];
    if (lastItem) {
      nextCursor = encodeCursor({
        id: lastItem.id,
        sortValue: ((lastItem as Record<string, unknown>)[sortColumn] as string | number | null) ?? null,
      });
    }
    rows.splice(safeLimit);
  }

  return {
    items: rows,
    nextCursor,
  };
}

/**
 * Lê uma configuração de system_settings com fallback tipado.
 */
export async function getSystemSetting<T>(
  db: D1Database,
  key: string,
  defaultValue: T,
): Promise<T> {
  try {
    const row = await queryOne<{ value_json: string }>(
      db,
      'SELECT value_json FROM system_settings WHERE key = ?',
      [key],
    );
    if (!row || !row.value_json) return defaultValue;
    return JSON.parse(row.value_json) as T;
  } catch {
    return defaultValue;
  }
}
