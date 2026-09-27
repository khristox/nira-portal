import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEventById,
  getEventProducts,
  getEventSponsors,
} from "@/lib/db";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "@/lib/product-actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const event = getEventById(id);
  if (!event) notFound();

  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;

  const products = getEventProducts(id);
  const sponsors = getEventSponsors(id);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/admin/events/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500"
        >
          ← Back to Event
        </Link>
        <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mt-2">
          Products — {event.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {products.length} product{products.length === 1 ? "" : "s"} exhibited
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
          <strong className="font-medium">Could not save:</strong> {error}
        </div>
      )}

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Add Product
        </h2>
        <form
          action={createProductAction}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <input type="hidden" name="event_id" value={id} />

          <div>
            <label className="block text-sm font-medium mb-1">
              Product name <span className="text-red-600">*</span>
            </label>
            <input
              name="name"
              required
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              name="category"
              placeholder="e.g., Software, Hardware"
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Exhibited by (sponsor)
            </label>
            <select
              name="sponsor_id"
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">— None —</option>
              {sponsors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              name="website"
              type="url"
              placeholder="https://..."
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Image (base64 — paste a data: URL or leave blank)
            </label>
            <input
              name="image_base64"
              placeholder="data:image/jpeg;base64,..."
              className="w-full p-2.5 font-mono text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sort order</label>
            <input
              name="sort_order"
              type="number"
              defaultValue={0}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Add Product
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Existing Products ({products.length})
        </h2>

        {products.length === 0 ? (
          <p className="p-5 text-gray-400 dark:text-gray-500 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
            No products yet.
          </p>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
            >
              <form
                action={updateProductAction}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="event_id" value={id} />

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Product name
                  </label>
                  <input
                    name="name"
                    defaultValue={p.name}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Category
                  </label>
                  <input
                    name="category"
                    defaultValue={p.category}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={p.description}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Exhibited by
                  </label>
                  <select
                    name="sponsor_id"
                    defaultValue={p.sponsor_id ?? ""}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="">— None —</option>
                    {sponsors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Website
                  </label>
                  <input
                    name="website"
                    type="url"
                    defaultValue={p.website}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Image (base64)
                  </label>
                  <input
                    name="image_base64"
                    defaultValue={p.image_base64}
                    className="w-full p-2 font-mono text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Sort order
                  </label>
                  <input
                    name="sort_order"
                    type="number"
                    defaultValue={p.sort_order}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                  >
                    Update
                  </button>
                  {p.image_base64 && (
                    <img
                      src={p.image_base64}
                      alt={p.name}
                      className="h-12 w-12 rounded object-cover border border-gray-200 dark:border-gray-700"
                    />
                  )}
                </div>
              </form>

              <form
                action={deleteProductAction}
                className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800"
              >
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="event_id" value={id} />
                <button
                  type="submit"
                  className="text-sm px-3 py-1 border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Delete Product
                </button>
              </form>
            </div>
          ))
        )}
      </section>
    </div>
  );
}