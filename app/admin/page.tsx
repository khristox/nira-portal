import Link from "next/link";
import { getAllServices, deleteService } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function deleteAction(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  if (id) {
    deleteService(id);
    revalidatePath("/admin");
    revalidatePath("/");
  }
}

export default function AdminPage() {
  const services = getAllServices();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Services ({services.length})
        </h2>
        <Link
          href="/admin/new"
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          + Add Service
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
        {services.length === 0 && (
          <p className="p-5 text-gray-400 dark:text-gray-500 text-center">
            No services yet.
          </p>
        )}
        {services.map((s) => (
          <div key={s.id} className="p-4 flex justify-between items-center gap-3">
            <div className="min-w-0">
              <h3 className="font-medium text-gray-800 dark:text-gray-100 truncate">
                {s.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {s.url}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link
                href={`/admin/edit/${s.id}`}
                className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
              >
                Edit
              </Link>
              <form action={deleteAction}>
                <input type="hidden" name="id" value={s.id} />
                <button
                  type="submit"
                  className="text-sm px-3 py-1 border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/"
        className="inline-block mt-6 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500"
      >
        ← Back to public portal
      </Link>
    </div>
  );
}