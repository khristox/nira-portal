const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(process.cwd(), "data", "nira.db");
const db = new Database(dbPath);

const today = new Date().toISOString().slice(0, 10);
const start = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const end   = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

// Remove any existing test-event so we don't duplicate
db.prepare("DELETE FROM events WHERE slug = ?").run("test-event");

const result = db
  .prepare(
    `INSERT INTO events
      (slug, title, subtitle, description, location, start_date, end_date, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
  .run(
    "test-event",
    "My Identity Expo & Symposium 2026",
    "Celebrating Uganda's identity",
    "",
    "Kampala, Uganda",
    start,
    end,
    1
  );

console.log("Created event id:", result.lastInsertRowid);
console.log("Range:", start, "→", end);
console.log("Today:", today);

const row = db
  .prepare("SELECT id, slug, title, start_date, end_date, is_published FROM events WHERE slug = ?")
  .get("test-event");
console.log("Stored:", row);

db.close();