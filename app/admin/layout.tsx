export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-red-700 dark:text-red-500">
          Admin — Manage Services
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Add, edit, or remove services shown on the public portal.
        </p>
      </div>
      {children}
    </div>
  );
}