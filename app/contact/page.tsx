export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Contact Us
      </h1>
      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <div className="flex items-start gap-3">
          <span className="font-semibold w-24">Address:</span>
          <span>Kololo Airstrip (Independence Grounds), Kampala</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="font-semibold w-24">Toll Free:</span>
          <a href="tel:0800211700" className="text-red-600 dark:text-red-500 hover:underline">
            0800 211 700
          </a>
        </div>
        <div className="flex items-start gap-3">
          <span className="font-semibold w-24">Email:</span>
          <a href="mailto:info@nira.go.ug" className="text-red-600 dark:text-red-500 hover:underline">
            info@nira.go.ug
          </a>
        </div>
      </div>
    </div>
  );
}