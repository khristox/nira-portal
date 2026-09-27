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
        banner_url    TEXT    DEFAULT '',
        start_date    TEXT    NOT NULL,
        end_date      TEXT    NOT NULL,
        is_published  INTEGER DEFAULT 0,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug
        ON events (slug);

      CREATE INDEX IF NOT EXISTS idx_events_dates
        ON events (start_date, end_date, is_published);

      CREATE TABLE IF NOT EXISTS event_days (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id      INTEGER NOT NULL,
        date          TEXT    NOT NULL,
        label         TEXT    DEFAULT '',
        sort_order    INTEGER DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_event_days_event_date
        ON event_days (event_id, date);

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

      CREATE INDEX IF NOT EXISTS idx_activities_day
        ON event_activities (day_id, sort_order);

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

      CREATE INDEX IF NOT EXISTS idx_sponsors_event
        ON event_sponsors (event_id, sort_order);

      -- ============================================================
      -- Event extensions: speakers, products, polls, surveys
      -- ============================================================

      CREATE TABLE IF NOT EXISTS event_speakers (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id      INTEGER NOT NULL,
        activity_id   INTEGER,
        name          TEXT    NOT NULL,
        title         TEXT    DEFAULT '',
        organization  TEXT    DEFAULT '',
        bio           TEXT    DEFAULT '',
        photo_base64  TEXT    DEFAULT '',
        website       TEXT    DEFAULT '',
        sort_order    INTEGER DEFAULT 0,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (activity_id) REFERENCES event_activities(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_speakers_event
        ON event_speakers (event_id, sort_order);

      CREATE INDEX IF NOT EXISTS idx_speakers_activity
        ON event_speakers (activity_id);

      CREATE TABLE IF NOT EXISTS event_products (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id      INTEGER NOT NULL,
        sponsor_id    INTEGER,
        name          TEXT    NOT NULL,
        description   TEXT    DEFAULT '',
        image_base64  TEXT    DEFAULT '',
        category      TEXT    DEFAULT '',
        website       TEXT    DEFAULT '',
        sort_order    INTEGER DEFAULT 0,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (sponsor_id) REFERENCES event_sponsors(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_products_event
        ON event_products (event_id, sort_order);

      CREATE TABLE IF NOT EXISTS event_polls (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id       INTEGER NOT NULL,
        question       TEXT    NOT NULL,
        description    TEXT    DEFAULT '',
        is_active      INTEGER DEFAULT 1,
        allow_multiple INTEGER DEFAULT 0,
        closes_at      DATETIME,
        sort_order     INTEGER DEFAULT 0,
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_polls_event
        ON event_polls (event_id, sort_order);

      CREATE TABLE IF NOT EXISTS event_poll_options (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        poll_id       INTEGER NOT NULL,
        label         TEXT    NOT NULL,
        sort_order    INTEGER DEFAULT 0,
        FOREIGN KEY (poll_id) REFERENCES event_polls(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_poll_options_poll
        ON event_poll_options (poll_id, sort_order);

      CREATE TABLE IF NOT EXISTS event_poll_votes (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        poll_id       INTEGER NOT NULL,
        option_id     INTEGER NOT NULL,
        voter_token   TEXT    NOT NULL,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (poll_id)   REFERENCES event_polls(id) ON DELETE CASCADE,
        FOREIGN KEY (option_id) REFERENCES event_poll_options(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_poll_votes_poll
        ON event_poll_votes (poll_id, option_id);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_votes_unique
        ON event_poll_votes (poll_id, voter_token, option_id);

      CREATE TABLE IF NOT EXISTS event_surveys (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id      INTEGER NOT NULL,
        title         TEXT    NOT NULL,
        description   TEXT    DEFAULT '',
        is_active     INTEGER DEFAULT 1,
        closes_at     DATETIME,
        sort_order    INTEGER DEFAULT 0,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_surveys_event
        ON event_surveys (event_id, sort_order);

      CREATE TABLE IF NOT EXISTS event_survey_questions (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        survey_id     INTEGER NOT NULL,
        kind          TEXT    NOT NULL DEFAULT 'text',
        prompt        TEXT    NOT NULL,
        help_text     TEXT    DEFAULT '',
        options_json  TEXT    DEFAULT '[]',
        is_required   INTEGER DEFAULT 0,
        sort_order    INTEGER DEFAULT 0,
        FOREIGN KEY (survey_id) REFERENCES event_surveys(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_survey_questions_survey
        ON event_survey_questions (survey_id, sort_order);

      CREATE TABLE IF NOT EXISTS event_survey_responses (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        survey_id     INTEGER NOT NULL,
        respondent    TEXT    DEFAULT '',
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (survey_id) REFERENCES event_surveys(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_survey_responses_survey
        ON event_survey_responses (survey_id);

      CREATE TABLE IF NOT EXISTS event_survey_answers (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        response_id   INTEGER NOT NULL,
        question_id   INTEGER NOT NULL,
        value_text    TEXT    DEFAULT '',
        FOREIGN KEY (response_id) REFERENCES event_survey_responses(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES event_survey_questions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_survey_answers_response
        ON event_survey_answers (response_id);
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

export type EventSpeaker = {
  id: number;
  event_id: number;
  activity_id: number | null;
  name: string;
  title: string;
  organization: string;
  bio: string;
  photo_base64: string;
  website: string;
  sort_order: number;
  created_at: string;
};

export type EventProduct = {
  id: number;
  event_id: number;
  sponsor_id: number | null;
  name: string;
  description: string;
  image_base64: string;
  category: string;
  website: string;
  sort_order: number;
  created_at: string;
};

export type EventPoll = {
  id: number;
  event_id: number;
  question: string;
  description: string;
  is_active: number;
  allow_multiple: number;
  closes_at: string | null;
  sort_order: number;
  created_at: string;
};

export type EventPollOption = {
  id: number;
  poll_id: number;
  label: string;
  sort_order: number;
};

export type EventPollVote = {
  id: number;
  poll_id: number;
  option_id: number;
  voter_token: string;
  created_at: string;
};

export type EventSurvey = {
  id: number;
  event_id: number;
  title: string;
  description: string;
  is_active: number;
  closes_at: string | null;
  sort_order: number;
  created_at: string;
};

export type SurveyQuestionKind =
  | "text"
  | "long_text"
  | "single_choice"
  | "multi_choice"
  | "rating"
  | "yes_no";

export type EventSurveyQuestion = {
  id: number;
  survey_id: number;
  kind: SurveyQuestionKind;
  prompt: string;
  help_text: string;
  options_json: string;
  is_required: number;
  sort_order: number;
};

export type EventSurveyResponse = {
  id: number;
  survey_id: number;
  respondent: string;
  created_at: string;
};

export type EventSurveyAnswer = {
  id: number;
  response_id: number;
  question_id: number;
  value_text: string;
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

export function getTodayProgram(
  eventId: number,
  today: string
): { day: EventDay; activities: EventActivity[] } | null {
  const day = db
    .prepare(
      `SELECT * FROM event_days
       WHERE event_id = ? AND date = ?
       LIMIT 1`
    )
    .get(eventId, today) as EventDay | undefined;

  if (!day) return null;

  const activities = getEventActivities(day.id);
  return { day, activities };
}

// ---------------------------------------------------------------------------
// Events — extended read helpers (speakers, products, polls, surveys)
// ---------------------------------------------------------------------------

export function getEventSpeakers(eventId: number): EventSpeaker[] {
  return db
    .prepare(
      `SELECT * FROM event_speakers
       WHERE event_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(eventId) as EventSpeaker[];
}

export function getSpeakersForActivity(activityId: number): EventSpeaker[] {
  return db
    .prepare(
      `SELECT * FROM event_speakers
       WHERE activity_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(activityId) as EventSpeaker[];
}

export function getEventProducts(eventId: number): EventProduct[] {
  return db
    .prepare(
      `SELECT * FROM event_products
       WHERE event_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(eventId) as EventProduct[];
}

export function getEventPolls(eventId: number, onlyActive = false): EventPoll[] {
  if (onlyActive) {
    return db
      .prepare(
        `SELECT * FROM event_polls
         WHERE event_id = ? AND is_active = 1
         ORDER BY sort_order ASC, id ASC`
      )
      .all(eventId) as EventPoll[];
  }
  return db
    .prepare(
      `SELECT * FROM event_polls
       WHERE event_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(eventId) as EventPoll[];
}

export function getPollOptions(pollId: number): EventPollOption[] {
  return db
    .prepare(
      `SELECT * FROM event_poll_options
       WHERE poll_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(pollId) as EventPollOption[];
}

export function getPollVoteCounts(
  pollId: number
): { option_id: number; count: number }[] {
  return db
    .prepare(
      `SELECT option_id, COUNT(*) as count
       FROM event_poll_votes
       WHERE poll_id = ?
       GROUP BY option_id`
    )
    .all(pollId) as { option_id: number; count: number }[];
}

export function getEventSurveys(
  eventId: number,
  onlyActive = false
): EventSurvey[] {
  if (onlyActive) {
    return db
      .prepare(
        `SELECT * FROM event_surveys
         WHERE event_id = ? AND is_active = 1
         ORDER BY sort_order ASC, id ASC`
      )
      .all(eventId) as EventSurvey[];
  }
  return db
    .prepare(
      `SELECT * FROM event_surveys
       WHERE event_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(eventId) as EventSurvey[];
}

export function getSurveyQuestions(surveyId: number): EventSurveyQuestion[] {
  return db
    .prepare(
      `SELECT * FROM event_survey_questions
       WHERE survey_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(surveyId) as EventSurveyQuestion[];
}

export function getEventIdBySlug(slug: string): number | null {
  const row = db
    .prepare(`SELECT id FROM events WHERE slug = ?`)
    .get(slug) as { id: number } | undefined;
  return row?.id ?? null;
}



// ---------------------------------------------------------------------------
// Events — speaker write helpers
// ---------------------------------------------------------------------------

export type SpeakerInput = {
  id?: number | null;
  activity_id?: number | null;
  name: string;
  title?: string | null;
  organization?: string | null;
  bio?: string | null;
  photo_base64?: string | null;
  website?: string | null;
  sort_order?: number | null;
};

export function createSpeaker(
  eventId: number,
  input: SpeakerInput
): EventSpeaker {
  if (!Number.isFinite(eventId)) {
    throw new ValidationError("Invalid event id.");
  }
  const event = getEventById(eventId);
  if (!event) throw new ValidationError("Event not found.");

  const name = String(input.name ?? "").trim();
  if (!name) throw new ValidationError("Speaker name is required.");

  const result = db
    .prepare(
      `INSERT INTO event_speakers
        (event_id, activity_id, name, title, organization, bio, photo_base64, website, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      eventId,
      input.activity_id ?? null,
      name,
      String(input.title ?? "").trim(),
      String(input.organization ?? "").trim(),
      String(input.bio ?? "").trim(),
      String(input.photo_base64 ?? ""),
      String(input.website ?? "").trim(),
      Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0
    );

  const created = db
    .prepare(`SELECT * FROM event_speakers WHERE id = ?`)
    .get(Number(result.lastInsertRowid)) as EventSpeaker | undefined;

  if (!created) throw new Error("Failed to fetch created speaker.");
  return created;
}

export function updateSpeaker(
  id: number,
  input: SpeakerInput
): EventSpeaker {
  if (!Number.isFinite(id)) throw new ValidationError("Invalid id.");

  const existing = db
    .prepare(`SELECT * FROM event_speakers WHERE id = ?`)
    .get(id) as EventSpeaker | undefined;
  if (!existing) throw new ValidationError("Speaker not found.");

  const name = String(input.name ?? "").trim();
  if (!name) throw new ValidationError("Speaker name is required.");

  db.prepare(
    `UPDATE event_speakers
     SET activity_id = ?, name = ?, title = ?, organization = ?, bio = ?, photo_base64 = ?, website = ?, sort_order = ?
     WHERE id = ?`
  ).run(
    input.activity_id ?? null,
    name,
    String(input.title ?? "").trim(),
    String(input.organization ?? "").trim(),
    String(input.bio ?? "").trim(),
    String(input.photo_base64 ?? ""),
    String(input.website ?? "").trim(),
    Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0,
    id
  );

  const updated = db
    .prepare(`SELECT * FROM event_speakers WHERE id = ?`)
    .get(id) as EventSpeaker | undefined;
  if (!updated) throw new Error("Failed to fetch updated speaker.");
  return updated;
}

export function deleteSpeaker(id: number): boolean {
  if (!Number.isFinite(id)) return false;
  const result = db.prepare(`DELETE FROM event_speakers WHERE id = ?`).run(id);
  return result.changes > 0;
}


// ---------------------------------------------------------------------------
// Events — product write helpers
// ---------------------------------------------------------------------------

export type ProductInput = {
  id?: number | null;
  sponsor_id?: number | null;
  name: string;
  description?: string | null;
  image_base64?: string | null;
  category?: string | null;
  website?: string | null;
  sort_order?: number | null;
};

export function createProduct(
  eventId: number,
  input: ProductInput
): EventProduct {
  if (!Number.isFinite(eventId)) {
    throw new ValidationError("Invalid event id.");
  }
  const event = getEventById(eventId);
  if (!event) throw new ValidationError("Event not found.");

  const name = String(input.name ?? "").trim();
  if (!name) throw new ValidationError("Product name is required.");

  const result = db
    .prepare(
      `INSERT INTO event_products
        (event_id, sponsor_id, name, description, image_base64, category, website, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      eventId,
      input.sponsor_id ?? null,
      name,
      String(input.description ?? "").trim(),
      String(input.image_base64 ?? ""),
      String(input.category ?? "").trim(),
      String(input.website ?? "").trim(),
      Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0
    );

  const created = db
    .prepare(`SELECT * FROM event_products WHERE id = ?`)
    .get(Number(result.lastInsertRowid)) as EventProduct | undefined;

  if (!created) throw new Error("Failed to fetch created product.");
  return created;
}

export function updateProduct(
  id: number,
  input: ProductInput
): EventProduct {
  if (!Number.isFinite(id)) throw new ValidationError("Invalid id.");

  const existing = db
    .prepare(`SELECT * FROM event_products WHERE id = ?`)
    .get(id) as EventProduct | undefined;
  if (!existing) throw new ValidationError("Product not found.");

  const name = String(input.name ?? "").trim();
  if (!name) throw new ValidationError("Product name is required.");

  db.prepare(
    `UPDATE event_products
     SET sponsor_id = ?, name = ?, description = ?, image_base64 = ?, category = ?, website = ?, sort_order = ?
     WHERE id = ?`
  ).run(
    input.sponsor_id ?? null,
    name,
    String(input.description ?? "").trim(),
    String(input.image_base64 ?? ""),
    String(input.category ?? "").trim(),
    String(input.website ?? "").trim(),
    Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0,
    id
  );

  const updated = db
    .prepare(`SELECT * FROM event_products WHERE id = ?`)
    .get(id) as EventProduct | undefined;
  if (!updated) throw new Error("Failed to fetch updated product.");
  return updated;
}

export function deleteProduct(id: number): boolean {
  if (!Number.isFinite(id)) return false;
  const result = db.prepare(`DELETE FROM event_products WHERE id = ?`).run(id);
  return result.changes > 0;
}


// ---------------------------------------------------------------------------
// Events — poll write helpers
// ---------------------------------------------------------------------------

export type PollInput = {
  id?: number | null;
  question: string;
  description?: string | null;
  is_active?: number | boolean | null;
  allow_multiple?: number | boolean | null;
  closes_at?: string | null;
  sort_order?: number | null;
};

export type PollOptionInput = {
  id?: number | null;
  label: string;
  sort_order?: number | null;
};

export function createPoll(eventId: number, input: PollInput): EventPoll {
  if (!Number.isFinite(eventId)) {
    throw new ValidationError("Invalid event id.");
  }
  const event = getEventById(eventId);
  if (!event) throw new ValidationError("Event not found.");

  const question = String(input.question ?? "").trim();
  if (!question) throw new ValidationError("Poll question is required.");

  const result = db
    .prepare(
      `INSERT INTO event_polls
        (event_id, question, description, is_active, allow_multiple, closes_at, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      eventId,
      question,
      String(input.description ?? "").trim(),
      input.is_active ? 1 : input.is_active === false ? 0 : 1,
      input.allow_multiple ? 1 : 0,
      input.closes_at ?? null,
      Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0
    );

  const created = db
    .prepare(`SELECT * FROM event_polls WHERE id = ?`)
    .get(Number(result.lastInsertRowid)) as EventPoll | undefined;
  if (!created) throw new Error("Failed to fetch created poll.");
  return created;
}

export function updatePoll(id: number, input: PollInput): EventPoll {
  if (!Number.isFinite(id)) throw new ValidationError("Invalid id.");

  const existing = db
    .prepare(`SELECT * FROM event_polls WHERE id = ?`)
    .get(id) as EventPoll | undefined;
  if (!existing) throw new ValidationError("Poll not found.");

  const question = String(input.question ?? "").trim();
  if (!question) throw new ValidationError("Poll question is required.");

  db.prepare(
    `UPDATE event_polls
     SET question = ?, description = ?, is_active = ?, allow_multiple = ?, closes_at = ?, sort_order = ?
     WHERE id = ?`
  ).run(
    question,
    String(input.description ?? "").trim(),
    input.is_active ? 1 : input.is_active === false ? 0 : existing.is_active,
    input.allow_multiple ? 1 : 0,
    input.closes_at ?? null,
    Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0,
    id
  );

  const updated = db
    .prepare(`SELECT * FROM event_polls WHERE id = ?`)
    .get(id) as EventPoll | undefined;
  if (!updated) throw new Error("Failed to fetch updated poll.");
  return updated;
}

export function deletePoll(id: number): boolean {
  if (!Number.isFinite(id)) return false;
  const result = db.prepare(`DELETE FROM event_polls WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function createPollOption(
  pollId: number,
  input: PollOptionInput
): EventPollOption {
  if (!Number.isFinite(pollId)) throw new ValidationError("Invalid poll id.");

  const poll = db
    .prepare(`SELECT * FROM event_polls WHERE id = ?`)
    .get(pollId) as EventPoll | undefined;
  if (!poll) throw new ValidationError("Poll not found.");

  const label = String(input.label ?? "").trim();
  if (!label) throw new ValidationError("Option label is required.");

  const result = db
    .prepare(
      `INSERT INTO event_poll_options (poll_id, label, sort_order)
       VALUES (?, ?, ?)`
    )
    .run(
      pollId,
      label,
      Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0
    );

  const created = db
    .prepare(`SELECT * FROM event_poll_options WHERE id = ?`)
    .get(Number(result.lastInsertRowid)) as EventPollOption | undefined;
  if (!created) throw new Error("Failed to fetch created poll option.");
  return created;
}

export function deletePollOption(id: number): boolean {
  if (!Number.isFinite(id)) return false;
  const result = db.prepare(`DELETE FROM event_poll_options WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function getPollById(id: number): EventPoll | undefined {
  if (!Number.isFinite(id)) return undefined;
  return db.prepare(`SELECT * FROM event_polls WHERE id = ?`).get(id) as
    | EventPoll
    | undefined;
}

export function hasVoted(
  pollId: number,
  voterToken: string,
  optionId?: number
): boolean {
  const row = optionId
    ? (db
        .prepare(
          `SELECT id FROM event_poll_votes
           WHERE poll_id = ? AND voter_token = ? AND option_id = ?
           LIMIT 1`
        )
        .get(pollId, voterToken, optionId) as { id: number } | undefined)
    : (db
        .prepare(
          `SELECT id FROM event_poll_votes
           WHERE poll_id = ? AND voter_token = ?
           LIMIT 1`
        )
        .get(pollId, voterToken) as { id: number } | undefined);
  return !!row;
}

export function recordVote(
  pollId: number,
  optionId: number,
  voterToken: string
): void {
  if (!Number.isFinite(pollId) || !Number.isFinite(optionId)) {
    throw new ValidationError("Invalid poll or option id.");
  }
  if (!voterToken || voterToken.length < 16) {
    throw new ValidationError("Invalid voter token.");
  }

  const poll = getPollById(pollId);
  if (!poll) throw new ValidationError("Poll not found.");
  if (!poll.is_active) throw new ValidationError("Poll is not active.");

  try {
    db.prepare(
      `INSERT INTO event_poll_votes (poll_id, option_id, voter_token)
       VALUES (?, ?, ?)`
    ).run(pollId, optionId, voterToken);
  } catch (err) {
    // UNIQUE constraint failure — user already voted for this option
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) {
      throw new ValidationError("You have already voted for this option.");
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Events — survey write helpers
// ---------------------------------------------------------------------------

export type SurveyInput = {
  id?: number | null;
  title: string;
  description?: string | null;
  is_active?: number | boolean | null;
  closes_at?: string | null;
  sort_order?: number | null;
};

export type SurveyQuestionInput = {
  id?: number | null;
  kind: SurveyQuestionKind;
  prompt: string;
  help_text?: string | null;
  options_json?: string | null;
  is_required?: number | boolean | null;
  sort_order?: number | null;
};

const ALLOWED_QUESTION_KINDS: SurveyQuestionKind[] = [
  "text",
  "long_text",
  "single_choice",
  "multi_choice",
  "rating",
  "yes_no",
];

function normalizeKind(value: unknown): SurveyQuestionKind {
  const v = String(value ?? "text") as SurveyQuestionKind;
  return ALLOWED_QUESTION_KINDS.includes(v) ? v : "text";
}

export function createSurvey(eventId: number, input: SurveyInput): EventSurvey {
  if (!Number.isFinite(eventId)) {
    throw new ValidationError("Invalid event id.");
  }
  const event = getEventById(eventId);
  if (!event) throw new ValidationError("Event not found.");

  const title = String(input.title ?? "").trim();
  if (!title) throw new ValidationError("Survey title is required.");

  const result = db
    .prepare(
      `INSERT INTO event_surveys
        (event_id, title, description, is_active, closes_at, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      eventId,
      title,
      String(input.description ?? "").trim(),
      input.is_active ? 1 : input.is_active === false ? 0 : 1,
      input.closes_at ?? null,
      Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0
    );

  const created = db
    .prepare(`SELECT * FROM event_surveys WHERE id = ?`)
    .get(Number(result.lastInsertRowid)) as EventSurvey | undefined;
  if (!created) throw new Error("Failed to fetch created survey.");
  return created;
}

export function updateSurvey(id: number, input: SurveyInput): EventSurvey {
  if (!Number.isFinite(id)) throw new ValidationError("Invalid id.");

  const existing = db
    .prepare(`SELECT * FROM event_surveys WHERE id = ?`)
    .get(id) as EventSurvey | undefined;
  if (!existing) throw new ValidationError("Survey not found.");

  const title = String(input.title ?? "").trim();
  if (!title) throw new ValidationError("Survey title is required.");

  db.prepare(
    `UPDATE event_surveys
     SET title = ?, description = ?, is_active = ?, closes_at = ?, sort_order = ?
     WHERE id = ?`
  ).run(
    title,
    String(input.description ?? "").trim(),
    input.is_active ? 1 : input.is_active === false ? 0 : existing.is_active,
    input.closes_at ?? null,
    Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0,
    id
  );

  const updated = db
    .prepare(`SELECT * FROM event_surveys WHERE id = ?`)
    .get(id) as EventSurvey | undefined;
  if (!updated) throw new Error("Failed to fetch updated survey.");
  return updated;
}

export function deleteSurvey(id: number): boolean {
  if (!Number.isFinite(id)) return false;
  const result = db.prepare(`DELETE FROM event_surveys WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function getSurveyById(id: number): EventSurvey | undefined {
  if (!Number.isFinite(id)) return undefined;
  return db.prepare(`SELECT * FROM event_surveys WHERE id = ?`).get(id) as
    | EventSurvey
    | undefined;
}

export function createSurveyQuestion(
  surveyId: number,
  input: SurveyQuestionInput
): EventSurveyQuestion {
  if (!Number.isFinite(surveyId)) throw new ValidationError("Invalid survey id.");

  const survey = getSurveyById(surveyId);
  if (!survey) throw new ValidationError("Survey not found.");

  const prompt = String(input.prompt ?? "").trim();
  if (!prompt) throw new ValidationError("Question prompt is required.");

  const kind = normalizeKind(input.kind);

  // Normalize options_json: for choice kinds, must be a JSON array of strings
  let options_json = "[]";
  if (kind === "single_choice" || kind === "multi_choice") {
    const raw = String(input.options_json ?? "[]");
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        options_json = JSON.stringify(
          parsed.map((o) => String(o)).filter((o) => o.trim().length > 0)
        );
      }
    } catch {
      throw new ValidationError("Options must be a valid JSON array.");
    }
  }

  const result = db
    .prepare(
      `INSERT INTO event_survey_questions
        (survey_id, kind, prompt, help_text, options_json, is_required, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      surveyId,
      kind,
      prompt,
      String(input.help_text ?? "").trim(),
      options_json,
      input.is_required ? 1 : 0,
      Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0
    );

  const created = db
    .prepare(`SELECT * FROM event_survey_questions WHERE id = ?`)
    .get(Number(result.lastInsertRowid)) as EventSurveyQuestion | undefined;
  if (!created) throw new Error("Failed to fetch created question.");
  return created;
}

export function deleteSurveyQuestion(id: number): boolean {
  if (!Number.isFinite(id)) return false;
  const result = db
    .prepare(`DELETE FROM event_survey_questions WHERE id = ?`)
    .run(id);
  return result.changes > 0;
}

export function getSurveyQuestionById(
  id: number
): EventSurveyQuestion | undefined {
  if (!Number.isFinite(id)) return undefined;
  return db
    .prepare(`SELECT * FROM event_survey_questions WHERE id = ?`)
    .get(id) as EventSurveyQuestion | undefined;
}

export function submitSurveyResponse(
  surveyId: number,
  respondent: string,
  answers: { question_id: number; value_text: string }[]
): EventSurveyResponse {
  if (!Number.isFinite(surveyId)) {
    throw new ValidationError("Invalid survey id.");
  }
  const survey = getSurveyById(surveyId);
  if (!survey) throw new ValidationError("Survey not found.");
  if (!survey.is_active) throw new ValidationError("Survey is not accepting responses.");

  const tx = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO event_survey_responses (survey_id, respondent)
         VALUES (?, ?)`
      )
      .run(surveyId, String(respondent ?? "").trim());

    const responseId = Number(result.lastInsertRowid);

    const insertAnswer = db.prepare(
      `INSERT INTO event_survey_answers
        (response_id, question_id, value_text)
       VALUES (?, ?, ?)`
    );

    for (const a of answers) {
      insertAnswer.run(responseId, a.question_id, String(a.value_text ?? ""));
    }

    return responseId;
  });

  const responseId = tx();

  const created = db
    .prepare(`SELECT * FROM event_survey_responses WHERE id = ?`)
    .get(responseId) as EventSurveyResponse | undefined;
  if (!created) throw new Error("Failed to fetch created response.");
  return created;
}

export function getSurveyResponseCount(surveyId: number): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) as c FROM event_survey_responses WHERE survey_id = ?`
    )
    .get(surveyId) as { c: number };
  return row.c;
}

export function getSurveyResponses(surveyId: number): EventSurveyResponse[] {
  return db
    .prepare(
      `SELECT * FROM event_survey_responses
       WHERE survey_id = ?
       ORDER BY created_at DESC`
    )
    .all(surveyId) as EventSurveyResponse[];
}

export function getSurveyAnswersForResponse(
  responseId: number
): EventSurveyAnswer[] {
  return db
    .prepare(
      `SELECT * FROM event_survey_answers WHERE response_id = ?`
    )
    .all(responseId) as EventSurveyAnswer[];
}


export function getSurveyAnswerTallies(
  surveyId: number
): Record<number, Record<string, number>> {
  const rows = db
    .prepare(
      `SELECT a.question_id, a.value_text, COUNT(*) as count
       FROM event_survey_answers a
       JOIN event_survey_responses r ON r.id = a.response_id
       WHERE r.survey_id = ?
       GROUP BY a.question_id, a.value_text`
    )
    .all(surveyId) as {
    question_id: number;
    value_text: string;
    count: number;
  }[];

  const result: Record<number, Record<string, number>> = {};
  for (const row of rows) {
    if (!result[row.question_id]) result[row.question_id] = {};
    result[row.question_id][row.value_text] = row.count;
  }
  return result;
}


// ---------------------------------------------------------------------------
// Event — aggregate survey stats (for admin list)
// ---------------------------------------------------------------------------

export function getEventSurveyStats(eventId: number): {
  totalSurveys: number;
  totalResponses: number;
} {
  const surveys = getEventSurveys(eventId);
  let totalResponses = 0;
  for (const s of surveys) {
    totalResponses += getSurveyResponseCount(s.id);
  }
  return { totalSurveys: surveys.length, totalResponses };
}

export function getEventPollStats(eventId: number): {
  totalPolls: number;
  totalVotes: number;
} {
  const polls = getEventPolls(eventId);
  let totalVotes = 0;
  for (const p of polls) {
    const counts = getPollVoteCounts(p.id);
    totalVotes += counts.reduce((sum, c) => sum + c.count, 0);
  }
  return { totalPolls: polls.length, totalVotes };
}