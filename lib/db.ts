import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "nira.db");

const globalForDb = globalThis as unknown as { db?: Database.Database };

export const db =
  globalForDb.db ??
  (() => {
    const instance = new Database(dbPath);

    // WAL for better read/write concurrency; foreign keys ON for safety
    instance.pragma("journal_mode = WAL");
    instance.pragma("foreign_keys = ON");

    // -----------------------------------------------------------------------
    // Schema
    // -----------------------------------------------------------------------
    instance.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        title         TEXT NOT NULL,
        description   TEXT    DEFAULT '',
        url           TEXT    DEFAULT '',
        emoji         TEXT    DEFAULT '',
        content_html  TEXT    DEFAULT '',
        chart_url     TEXT    DEFAULT '',
        render_mode   TEXT    DEFAULT 'link'
                       CHECK (render_mode IN ('link', 'content')),
        sort_order    INTEGER DEFAULT 0,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_services_sort
        ON services (sort_order, created_at DESC);
    `);

    // -----------------------------------------------------------------------
    // Idempotent migrations for existing DBs
    // -----------------------------------------------------------------------
    const cols = instance
      .prepare("PRAGMA table_info(services)")
      .all() as { name: string }[];
    const names = new Set(cols.map((c) => c.name));

    const migrations: Array<[string, string]> = [
      ["emoji",        "ALTER TABLE services ADD COLUMN emoji        TEXT    DEFAULT ''"],
      ["content_html", "ALTER TABLE services ADD COLUMN content_html TEXT    DEFAULT ''"],
      ["chart_url",    "ALTER TABLE services ADD COLUMN chart_url    TEXT    DEFAULT ''"],
      ["render_mode",  "ALTER TABLE services ADD COLUMN render_mode  TEXT    DEFAULT 'link'"],
      ["description",  "ALTER TABLE services ADD COLUMN description  TEXT    DEFAULT ''"],
      ["url",          "ALTER TABLE services ADD COLUMN url          TEXT    DEFAULT ''"],
      ["sort_order",   "ALTER TABLE services ADD COLUMN sort_order   INTEGER DEFAULT 0"],
      ["created_at",   "ALTER TABLE services ADD COLUMN created_at   DATETIME DEFAULT CURRENT_TIMESTAMP"],
    ];

    for (const [col, sql] of migrations) {
      if (!names.has(col)) instance.exec(sql);
    }

    return instance;
  })();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RenderMode = "link" | "content";

export type Service = {
  id: number;
  title: string;
  description: string;
  url: string;
  emoji: string;
  content_html: string;
  chart_url: string;
  render_mode: RenderMode;
  sort_order: number;
  created_at: string;
};

export type ServiceInput = {
  title: string;
  description?: string | null;
  url?: string | null;
  emoji?: string | null;
  content_html?: string | null;
  chart_url?: string | null;
  render_mode?: RenderMode | null;
  sort_order?: number | null;
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function normalizeRenderMode(value: unknown): RenderMode {
  return value === "content" ? "content" : "link";
}

function validateInput(input: ServiceInput): {
  title: string;
  description: string;
  url: string;
  emoji: string;
  content_html: string;
  chart_url: string;
  render_mode: RenderMode;
  sort_order: number;
} {
  const title = String(input.title ?? "").trim();
  if (!title) throw new ValidationError("Title is required.");

  const url = String(input.url ?? "").trim();
  const content_html = String(input.content_html ?? "").trim();

  // A service must have at least one of: external URL or inline HTML
  if (!url && !content_html) {
    throw new ValidationError(
      "Provide either an external URL or HTML content."
    );
  }

  if (url) {
    try {
      new URL(url);
    } catch {
      throw new ValidationError("URL is not valid.");
    }
  }

  const chart_url = String(input.chart_url ?? "").trim();
  if (chart_url) {
    try {
      new URL(chart_url);
    } catch {
      throw new ValidationError("Chart URL is not valid.");
    }
  }

  return {
    title,
    description: String(input.description ?? "").trim(),
    url,
    emoji: String(input.emoji ?? "").trim().slice(0, 8), // guard against abuse
    content_html,
    chart_url,
    render_mode: normalizeRenderMode(input.render_mode),
    sort_order: Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0,
  };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

const SELECT_COLUMNS = `
  id, title, description, url, emoji, content_html, chart_url,
  render_mode, sort_order, created_at
`;

export function getAllServices(): Service[] {
  return db
    .prepare(
      `SELECT ${SELECT_COLUMNS}
       FROM services
       ORDER BY sort_order ASC, created_at DESC`
    )
    .all() as Service[];
}

export function searchServices(query: string): Service[] {
  const q = query.trim().toLowerCase();
  if (!q) return getAllServices();

  const like = `%${q}%`;
  return db
    .prepare(
      `SELECT ${SELECT_COLUMNS}
       FROM services
       WHERE LOWER(title)       LIKE ?
          OR LOWER(description) LIKE ?
          OR LOWER(url)         LIKE ?
       ORDER BY sort_order ASC, created_at DESC`
    )
    .all(like, like, like) as Service[];
}

export function getServiceById(id: number): Service | undefined {
  if (!Number.isFinite(id)) return undefined;
  return db
    .prepare(`SELECT ${SELECT_COLUMNS} FROM services WHERE id = ?`)
    .get(id) as Service | undefined;
}

export function getDashboardServices(): Service[] {
  return db
    .prepare(
      `SELECT ${SELECT_COLUMNS}
       FROM services
       WHERE chart_url IS NOT NULL AND TRIM(chart_url) <> ''
       ORDER BY sort_order ASC, created_at DESC`
    )
    .all() as Service[];
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export function createService(input: ServiceInput): Service {
  const data = validateInput(input);

  const result = db
    .prepare(
      `INSERT INTO services
        (title, description, url, emoji, content_html, chart_url, render_mode, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.title,
      data.description,
      data.url,
      data.emoji,
      data.content_html,
      data.chart_url,
      data.render_mode,
      data.sort_order
    );

  const created = getServiceById(Number(result.lastInsertRowid));
  if (!created) throw new Error("Failed to fetch created service.");
  return created;
}

export function updateService(id: number, input: ServiceInput): Service {
  if (!Number.isFinite(id)) throw new ValidationError("Invalid id.");
  if (!getServiceById(id)) throw new ValidationError("Service not found.");

  const data = validateInput(input);

  db.prepare(
    `UPDATE services
     SET title = ?,
         description = ?,
         url = ?,
         emoji = ?,
         content_html = ?,
         chart_url = ?,
         render_mode = ?,
         sort_order = ?
     WHERE id = ?`
  ).run(
    data.title,
    data.description,
    data.url,
    data.emoji,
    data.content_html,
    data.chart_url,
    data.render_mode,
    data.sort_order,
    id
  );

  const updated = getServiceById(id);
  if (!updated) throw new Error("Failed to fetch updated service.");
  return updated;
}

export function deleteService(id: number): boolean {
  if (!Number.isFinite(id)) return false;
  const result = db.prepare(`DELETE FROM services WHERE id = ?`).run(id);
  return result.changes > 0;
}