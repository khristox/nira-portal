import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from "./constants";

// Re-export for convenience (backwards compatible with old imports)
export {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from "./constants";
export type { LanguageCode } from "./constants";

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

    instance.pragma("journal_mode = WAL");
    instance.pragma("foreign_keys = ON");
    instance.pragma("busy_timeout = 5000");

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
        language      TEXT    NOT NULL DEFAULT 'en',
        sort_order    INTEGER DEFAULT 0,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_services_sort
        ON services (sort_order, created_at DESC);

      CREATE TABLE IF NOT EXISTS service_translations (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id    INTEGER NOT NULL,
        language      TEXT    NOT NULL,
        title         TEXT    DEFAULT '',
        description   TEXT    DEFAULT '',
        content_html  TEXT    DEFAULT '',
        updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_translations_service_lang
        ON service_translations (service_id, language);

      CREATE INDEX IF NOT EXISTS idx_translations_lang
        ON service_translations (language);

CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT    NOT NULL,
  title         TEXT    NOT NULL,
  subtitle      TEXT    DEFAULT '',
  description   TEXT    DEFAULT '',
  location      TEXT    DEFAULT '',
  banner_url    TEXT    DEFAULT '',      -- optional hero image
  start_date    TEXT    NOT NULL,        -- ISO 'YYYY-MM-DD'
  end_date      TEXT    NOT NULL,        -- ISO 'YYYY-MM-DD'
  is_published  INTEGER DEFAULT 0,       -- 0 = draft, 1 = live
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events (slug);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events (start_date, end_date, is_published);

CREATE TABLE IF NOT EXISTS event_days (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id      INTEGER NOT NULL,
  date          TEXT    NOT NULL,        -- ISO 'YYYY-MM-DD'
  label         TEXT    DEFAULT '',      -- e.g., "Day One"
  sort_order    INTEGER DEFAULT 0,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_days_event_date ON event_days (event_id, date);

CREATE TABLE IF NOT EXISTS event_activities (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  day_id        INTEGER NOT NULL,
  start_time    TEXT    DEFAULT '',      -- 'HH:MM' 24h
  end_time      TEXT    DEFAULT '',      -- 'HH:MM'
  title         TEXT    NOT NULL,
  description   TEXT    DEFAULT '',
  sort_order    INTEGER DEFAULT 0,
  FOREIGN KEY (day_id) REFERENCES event_days(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activities_day ON event_activities (day_id, sort_order);

CREATE TABLE IF NOT EXISTS event_sponsors (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id      INTEGER NOT NULL,
  name          TEXT    NOT NULL,
  logo_base64   TEXT    DEFAULT '',      -- 'data:image/png;base64,...'
  website       TEXT    DEFAULT '',
  tier          TEXT    DEFAULT 'partner', -- 'platinum' | 'gold' | 'silver' | 'partner'
  sort_order    INTEGER DEFAULT 0,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sponsors_event ON event_sponsors (event_id, sort_order);

CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT    NOT NULL,
  title         TEXT    NOT NULL,
  subtitle      TEXT    DEFAULT '',
  description   TEXT    DEFAULT '',
  location      TEXT    DEFAULT '',
  banner_url    TEXT    DEFAULT '',
  start_date    TEXT    NOT NULL,
  end_date      TEXT    NOT NULL,
  is_published  INTEGER DEFAULT 0,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events (slug);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events (start_date, end_date, is_published);

CREATE TABLE IF NOT EXISTS event_days (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id      INTEGER NOT NULL,
  date          TEXT    NOT NULL,
  label         TEXT    DEFAULT '',
  sort_order    INTEGER DEFAULT 0,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_days_event ON event_days (event_id, date);

CREATE TABLE IF NOT EXISTS event_activities (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  day_id        INTEGER NOT NULL,
  start_time    TEXT    DEFAULT '',
  end_time      TEXT    DEFAULT '',
  title         TEXT    NOT NULL,
  description   TEXT    DEFAULT '',
  sort_order    INTEGER DEFAULT 0,
  FOREIGN KEY (day_id) REFERENCES event_days(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activities_day ON event_activities (day_id, sort_order);

CREATE TABLE IF NOT EXISTS event_sponsors (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id      INTEGER NOT NULL,
  name          TEXT    NOT NULL,
  logo_base64   TEXT    DEFAULT '',
  website       TEXT    DEFAULT '',
  tier          TEXT    DEFAULT 'partner',
  sort_order    INTEGER DEFAULT 0,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sponsors_event ON event_sponsors (event_id, sort_order);

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
      ["language",     "ALTER TABLE services ADD COLUMN language     TEXT    NOT NULL DEFAULT 'en'"],
      ["sort_order",   "ALTER TABLE services ADD COLUMN sort_order   INTEGER DEFAULT 0"],
      ["created_at",   "ALTER TABLE services ADD COLUMN created_at   DATETIME DEFAULT CURRENT_TIMESTAMP"],
    ];

    for (const [col, sql] of migrations) {
      if (!names.has(col)) instance.exec(sql);
    }

    instance.exec(`
      CREATE INDEX IF NOT EXISTS idx_services_language
        ON services (language, sort_order);
    `);

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
  language: string;
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
  language?: string | null;
  sort_order?: number | null;
};

export type Translation = {
  id: number;
  service_id: number;
  language: string;
  title: string;
  description: string;
  content_html: string;
  updated_at: string;
};

export type TranslationInput = {
  language: string;
  title?: string | null;
  description?: string | null;
  content_html?: string | null;
};

export type LocalizedService = Service & {
  translationApplied: boolean;
};




export type Event = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  location: string;
  banner_url: string;
  start_date: string;
  end_date: string;
  is_published: number;
  created_at: string;
  updated_at: string;
};

export type EventDay = {
  id: number;
  event_id: number;
  date: string;
  label: string;
  sort_order: number;
};

export type EventActivity = {
  id: number;
  day_id: number;
  start_time: string;
  end_time: string;
  title: string;
  description: string;
  sort_order: number;
};

export type EventSponsor = {
  id: number;
  event_id: number;
  name: string;
  logo_base64: string;
  website: string;
  tier: string;
  sort_order: number;
};

export type EventWithProgram = Event & {
  days: (EventDay & { activities: EventActivity[] })[];
  sponsors: EventSponsor[];
};

export type EventInput = {
  id?: number | null;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  location?: string | null;
  banner_url?: string | null;
  start_date: string;
  end_date: string;
  is_published?: number | boolean | null;
  days: {
    id?: number | null;
    date: string;
    label?: string | null;
    sort_order?: number | null;
    activities: {
      id?: number | null;
      start_time?: string | null;
      end_time?: string | null;
      title: string;
      description?: string | null;
      sort_order?: number | null;
    }[];
  }[];
  sponsors: {
    id?: number | null;
    name: string;
    logo_base64?: string | null;
    website?: string | null;
    tier?: string | null;
    sort_order?: number | null;
  }[];
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

function normalizeLanguage(value: unknown): string {
  const code = String(value ?? "").trim().toLowerCase();
  if (!code) return DEFAULT_LANGUAGE;
  const supported = SUPPORTED_LANGUAGES.some((l) => l.code === code);
  if (!supported) {
    throw new ValidationError(
      `Unsupported language "${code}". Supported: ${SUPPORTED_LANGUAGES.map(
        (l) => l.code
      ).join(", ")}.`
    );
  }
  return code;
}

type ValidatedInput = {
  title: string;
  description: string;
  url: string;
  emoji: string;
  content_html: string;
  chart_url: string;
  render_mode: RenderMode;
  language: string;
  sort_order: number;
};

function validateInput(input: ServiceInput): ValidatedInput {
  const title = String(input.title ?? "").trim();
  if (!title) throw new ValidationError("Title is required.");
  if (title.length > 200) throw new ValidationError("Title is too long (max 200 characters).");

  const url = String(input.url ?? "").trim();
  const content_html = String(input.content_html ?? "").trim();

  if (!url && !content_html) {
    throw new ValidationError("Provide either an external URL or HTML content.");
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
    description: String(input.description ?? "").trim().slice(0, 500),
    url,
    emoji: String(input.emoji ?? "").trim().slice(0, 8),
    content_html,
    chart_url,
    render_mode: normalizeRenderMode(input.render_mode),
    language: normalizeLanguage(input.language),
    sort_order: Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0,
  };
}

// ---------------------------------------------------------------------------
// Read — base services (English defaults)
// ---------------------------------------------------------------------------

const SELECT_COLUMNS = `
  id, title, description, url, emoji, content_html, chart_url,
  render_mode, language, sort_order, created_at
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

export function getServiceById(id: number): Service | undefined {
  if (!Number.isFinite(id)) return undefined;
  return db
    .prepare(`SELECT ${SELECT_COLUMNS} FROM services WHERE id = ?`)
    .get(id) as Service | undefined;
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

export function countServices(): number {
  const row = db.prepare(`SELECT COUNT(*) as c FROM services`).get() as { c: number };
  return row.c;
}

// ---------------------------------------------------------------------------
// Read — translations
// ---------------------------------------------------------------------------

export function getTranslation(
  serviceId: number,
  language: string
): Translation | undefined {
  return db
    .prepare(
      `SELECT id, service_id, language, title, description, content_html, updated_at
       FROM service_translations
       WHERE service_id = ? AND language = ?`
    )
    .get(serviceId, language) as Translation | undefined;
}

export function getTranslationsForService(serviceId: number): Translation[] {
  return db
    .prepare(
      `SELECT id, service_id, language, title, description, content_html, updated_at
       FROM service_translations
       WHERE service_id = ?
       ORDER BY language ASC`
    )
    .all(serviceId) as Translation[];
}

export function getAllTranslationsForLanguage(language: string): Translation[] {
  return db
    .prepare(
      `SELECT id, service_id, language, title, description, content_html, updated_at
       FROM service_translations
       WHERE language = ?
       ORDER BY service_id ASC`
    )
    .all(language) as Translation[];
}

// ---------------------------------------------------------------------------
// Write — base services
// ---------------------------------------------------------------------------

export function createService(input: ServiceInput): Service {
  const data = validateInput(input);

  const result = db
    .prepare(
      `INSERT INTO services
        (title, description, url, emoji, content_html, chart_url, render_mode, language, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.title,
      data.description,
      data.url,
      data.emoji,
      data.content_html,
      data.chart_url,
      data.render_mode,
      data.language,
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
         language = ?,
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
    data.language,
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

// ---------------------------------------------------------------------------
// Write — translations
// ---------------------------------------------------------------------------

export function upsertTranslation(
  serviceId: number,
  input: TranslationInput
): Translation {
  if (!Number.isFinite(serviceId)) {
    throw new ValidationError("Invalid service id.");
  }

  const service = getServiceById(serviceId);
  if (!service) throw new ValidationError("Service not found.");

  const language = normalizeLanguage(input.language);
  if (language === DEFAULT_LANGUAGE) {
    throw new ValidationError(
      "Use the Edit Service form to change the English version."
    );
  }

  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim().slice(0, 500);
  const content_html = String(input.content_html ?? "").trim();

  const existing = getTranslation(serviceId, language);

  if (existing) {
    db.prepare(
      `UPDATE service_translations
       SET title = ?, description = ?, content_html = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(title, description, content_html, existing.id);
  } else {
    db.prepare(
      `INSERT INTO service_translations
        (service_id, language, title, description, content_html)
       VALUES (?, ?, ?, ?, ?)`
    ).run(serviceId, language, title, description, content_html);
  }

  const saved = getTranslation(serviceId, language);
  if (!saved) throw new Error("Failed to save translation.");
  return saved;
}

export function deleteTranslation(serviceId: number, language: string): boolean {
  const result = db
    .prepare(
      `DELETE FROM service_translations WHERE service_id = ? AND language = ?`
    )
    .run(serviceId, language);
  return result.changes > 0;
}

// ---------------------------------------------------------------------------
// Localized views (with English fallback)
// ---------------------------------------------------------------------------

export function getLocalizedServices(language: string): LocalizedService[] {
  const services = getAllServices();
  if (language === DEFAULT_LANGUAGE) {
    return services.map((s) => ({ ...s, translationApplied: false }));
  }

  const translations = getAllTranslationsForLanguage(language);
  const map = new Map(translations.map((t) => [t.service_id, t]));

  return services.map((s) => {
    const t = map.get(s.id);
    if (!t) return { ...s, translationApplied: false };

    return {
      ...s,
      title: t.title?.trim() || s.title,
      description: t.description?.trim() || s.description,
      content_html: t.content_html?.trim() || s.content_html,
      translationApplied: true,
    };
  });
}

export function getLocalizedServiceById(
  id: number,
  language: string
): LocalizedService | undefined {
  const s = getServiceById(id);
  if (!s) return undefined;

  if (language === DEFAULT_LANGUAGE) {
    return { ...s, translationApplied: false };
  }

  const t = getTranslation(id, language);
  if (!t) return { ...s, translationApplied: false };

  return {
    ...s,
    title: t.title?.trim() || s.title,
    description: t.description?.trim() || s.description,
    content_html: t.content_html?.trim() || s.content_html,
    translationApplied: true,
  };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

export function getLanguageStats(): { language: string; count: number }[] {
  return db
    .prepare(
      `SELECT language, COUNT(*) as count
       FROM service_translations
       GROUP BY language
       ORDER BY language ASC`
    )
    .all() as { language: string; count: number }[];
}

// ---------------------------------------------------------------------------
// Events — read
// ---------------------------------------------------------------------------

export function getEventById(id: number): Event | undefined {
  if (!Number.isFinite(id)) return undefined;
  return db.prepare(`SELECT * FROM events WHERE id = ?`).get(id) as
    | Event
    | undefined;
}

export function getEventBySlug(slug: string): Event | undefined {
  return db.prepare(`SELECT * FROM events WHERE slug = ?`).get(slug) as
    | Event
    | undefined;
}

export function getAllEvents(): Event[] {
  return db
    .prepare(`SELECT * FROM events ORDER BY start_date DESC`)
    .all() as Event[];
}

export function getPublishedEvents(): Event[] {
  return db
    .prepare(
      `SELECT * FROM events WHERE is_published = 1 ORDER BY start_date DESC`
    )
    .all() as Event[];
}

export function getLiveEvent(today: string): Event | undefined {
  return db
    .prepare(
      `SELECT * FROM events
       WHERE is_published = 1
         AND start_date <= ?
         AND end_date >= ?
       ORDER BY start_date DESC
       LIMIT 1`
    )
    .get(today, today) as Event | undefined;
}

export function getUpcomingEvents(today: string, limit = 5): Event[] {
  return db
    .prepare(
      `SELECT * FROM events
       WHERE is_published = 1 AND start_date > ?
       ORDER BY start_date ASC
       LIMIT ?`
    )
    .all(today, limit) as Event[];
}

export function getEventDays(eventId: number): EventDay[] {
  return db
    .prepare(
      `SELECT * FROM event_days
       WHERE event_id = ?
       ORDER BY date ASC, sort_order ASC`
    )
    .all(eventId) as EventDay[];
}

export function getEventActivities(dayId: number): EventActivity[] {
  return db
    .prepare(
      `SELECT * FROM event_activities
       WHERE day_id = ?
       ORDER BY sort_order ASC, start_time ASC`
    )
    .all(dayId) as EventActivity[];
}

export function getEventSponsors(eventId: number): EventSponsor[] {
  return db
    .prepare(
      `SELECT * FROM event_sponsors
       WHERE event_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(eventId) as EventSponsor[];
}

export function getEventWithProgram(slug: string): EventWithProgram | undefined {
  const event = getEventBySlug(slug);
  if (!event) return undefined;

  const days = getEventDays(event.id).map((d) => ({
    ...d,
    activities: getEventActivities(d.id),
  }));

  return {
    ...event,
    days,
    sponsors: getEventSponsors(event.id),
  };
}

export function getEventWithProgramById(id: number): EventWithProgram | undefined {
  const event = getEventById(id);
  if (!event) return undefined;

  const days = getEventDays(event.id).map((d) => ({
    ...d,
    activities: getEventActivities(d.id),
  }));

  return {
    ...event,
    days,
    sponsors: getEventSponsors(event.id),
  };
}