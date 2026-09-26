"use client";

import { useState } from "react";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/constants";

type Translation = {
  id: number;
  service_id: number;
  language: string;
  title: string;
  description: string;
  content_html: string;
  updated_at: string;
};

export default function TranslationsEditor({
  serviceId,
  initialTranslations,
}: {
  serviceId: number;
  initialTranslations: Translation[];
}) {
  const [translations, setTranslations] = useState(initialTranslations);
  const [language, setLanguage] = useState("lg");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const existing = translations.find((t) => t.language === language);
  const availableLanguages = SUPPORTED_LANGUAGES.filter(
    (l) => l.code !== DEFAULT_LANGUAGE
  );

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/translations/${serviceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          title,
          description,
          content_html: contentHtml,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setTranslations((prev) => {
        const others = prev.filter((t) => t.language !== language);
        return [...others, data.translation];
      });
      setMessage(`Saved ${language.toUpperCase()} translation.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessage(`Error: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  async function remove(lang: string) {
    if (!confirm(`Delete ${lang.toUpperCase()} translation?`)) return;
    await fetch(`/api/translations/${serviceId}?language=${lang}`, {
      method: "DELETE",
    });
    setTranslations((prev) => prev.filter((t) => t.language !== lang));
    if (language === lang) {
      setTitle("");
      setDescription("");
      setContentHtml("");
    }
  }

  function pickLanguage(code: string) {
    setLanguage(code);
    const t = translations.find((x) => x.language === code);
    setTitle(t?.title ?? "");
    setDescription(t?.description ?? "");
    setContentHtml(t?.content_html ?? "");
    setMessage(null);
  }

  return (
    <div className="mt-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
        Translations
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        The English version is what you edited above. Add translations for other
        languages — missing fields fall back to English.
      </p>

      {translations.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {translations.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-medium px-2.5 py-1 rounded-full"
            >
              <button
                type="button"
                onClick={() => pickLanguage(t.language)}
                className="hover:text-red-600"
                title="Edit"
              >
                {t.language.toUpperCase()}
              </button>
              <button
                type="button"
                onClick={() => remove(t.language)}
                className="text-red-500 hover:text-red-700"
                title="Delete"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Language
        </label>
        <select
          value={language}
          onChange={(e) => pickLanguage(e.target.value)}
          className="w-full sm:w-64 p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {availableLanguages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.emoji} {l.native}
            </option>
          ))}
        </select>
        {existing && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Editing existing {language.toUpperCase()} translation
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title ({language.toUpperCase()})
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Leave empty to use English title"
            className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Short Description ({language.toUpperCase()})
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Leave empty to use English description"
            className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rich HTML Content ({language.toUpperCase()})
          </label>
          <textarea
            value={contentHtml}
            onChange={(e) => setContentHtml(e.target.value)}
            rows={8}
            placeholder="Leave empty to use English content"
            className="w-full p-2.5 font-mono text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : existing
            ? "Update Translation"
            : "Add Translation"}
        </button>
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        )}
      </div>
    </div>
  );
}