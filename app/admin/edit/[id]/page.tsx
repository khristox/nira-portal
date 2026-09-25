import { getServiceById, updateService, ValidationError } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

async function updateAction(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  const payload = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    url: String(formData.get("url") ?? ""),
    emoji: String(formData.get("emoji") ?? ""),
    content_html: String(formData.get("content_html") ?? ""),
    chart_url: String(formData.get("chart_url") ?? ""),
    render_mode: String(formData.get("render_mode") ?? "link") as
      | "link"
      | "content",
    sort_order: Number(formData.get("sort_order") ?? 0),
  };

  if (!Number.isFinite(id) || id <= 0) {
    redirect("/admin");
  }

  try {
    updateService(id, payload);
  } catch (err) {
    if (err instanceof ValidationError) {
      const params = new URLSearchParams({
        error: err.message,
        title: payload.title,
        description: payload.description,
        url: payload.url,
        emoji: payload.emoji,
        content_html: payload.content_html,
        chart_url: payload.chart_url,
        render_mode: payload.render_mode,
        sort_order: String(payload.sort_order),
      });
      redirect(`/admin/edit/${id}?${params.toString()}`);
    }
    throw err;
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/dashboards");
  revalidatePath(`/services/${id}`);
  redirect("/admin");
}

export default async function EditServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const service = getServiceById(id);
  if (!service) notFound();

  const sp = await searchParams;
  const get = (key: string, fallback = ""): string => {
    const v = sp[key];
    return typeof v === "string" ? v : fallback;
  };

  const error = get("error");

  // If we have an error redirect, prefer those values (they're the user's latest attempt).
  // Otherwise fall back to the DB record.
  const values = {
    title: get("title", service.title),
    description: get("description", service.description ?? ""),
    url: get("url", service.url ?? ""),
    emoji: get("emoji", service.emoji ?? ""),
    content_html: get("content_html", service.content_html ?? ""),
    chart_url: get("chart_url", service.chart_url ?? ""),
    render_mode: (get("render_mode", service.render_mode ?? "link") === "content"
      ? "content"
      : "link") as "link" | "content",
    sort_order: get("sort_order", String(service.sort_order ?? 0)),
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500"
        >
          ← Back to Services
        </Link>
        <h2 className="text-xl font-semibold mt-2 text-gray-800 dark:text-gray-100">
          Edit service
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          ID #{service.id}
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
          <strong className="font-medium">Could not save:</strong> {error}
        </div>
      )}

      <form
        action={updateAction}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 space-y-5"
      >
        <input type="hidden" name="id" value={service.id} />

        {/* Emoji + Title */}
        <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Emoji
            </label>
            <input
              name="emoji"
              maxLength={4}
              defaultValue={values.emoji}
              placeholder="🪪"
              className="w-full p-2.5 text-center text-2xl border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              name="title"
              required
              defaultValue={values.title}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Short description
          </label>
          <input
            name="description"
            defaultValue={values.description}
            className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Display mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Display mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                values.render_mode === "link"
                  ? "border-red-500 bg-red-50 dark:bg-red-950"
                  : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <input
                type="radio"
                name="render_mode"
                value="link"
                defaultChecked={values.render_mode === "link"}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  Link
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Show a button that opens an external URL
                </div>
              </div>
            </label>
            <label
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                values.render_mode === "content"
                  ? "border-red-500 bg-red-50 dark:bg-red-950"
                  : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <input
                type="radio"
                name="render_mode"
                value="content"
                defaultChecked={values.render_mode === "content"}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  Content
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Render HTML content inline on the page
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* External URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            External URL <span className="text-gray-400">(optional)</span>
          </label>
          <input
            name="url"
            type="url"
            defaultValue={values.url}
            placeholder="https://example.com"
            className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Leave empty if you only want to display HTML content inline.
          </p>
        </div>

        {/* Rich HTML content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rich HTML content <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            name="content_html"
            rows={8}
            defaultValue={values.content_html}
            placeholder={'<h2>Requirements</h2>\n<ol>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ol>'}
            className="w-full p-2.5 font-mono text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Sanitized on render. Inline styles like{" "}
            <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
              style="color:red"
            </code>{" "}
            are preserved. Scripts, <code>onclick</code>, and <code>javascript:</code> URLs
            are stripped.
          </p>
        </div>

        {/* Chart embed URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Chart embed URL <span className="text-gray-400">(optional)</span>
          </label>
          <input
            name="chart_url"
            type="url"
            defaultValue={values.chart_url}
            placeholder="https://kibana.yourdomain.com/app/..."
            className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Only embed URLs from trusted sources (your own Kibana / Elasticsearch dashboards).
          </p>
        </div>

        {/* Sort order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort order
          </label>
          <input
            name="sort_order"
            type="number"
            defaultValue={values.sort_order}
            className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Lower numbers appear first.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Update Service
          </button>
          <Link
            href="/admin"
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Danger zone */}
      <div className="mt-8 p-4 border border-red-200 dark:border-red-900 rounded-xl bg-red-50/50 dark:bg-red-950/30">
        <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
          Danger zone
        </h3>
        <p className="text-xs text-red-700/80 dark:text-red-400/80 mb-3">
          Deleting this service cannot be undone.
        </p>
        <Link
          href="/admin"
          className="inline-block text-xs px-3 py-1.5 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-950"
        >
          Manage deletion from the list
        </Link>
      </div>
    </div>
  );
}