export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        About NIRA
      </h1>
      <div className="prose prose-lg dark:prose-invert">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          The National Identification and Registration Authority (NIRA) is responsible for 
          the registration of births, deaths, and the issuance of national identification 
          documents in Uganda.
        </p>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
          This portal provides quick access to our digital services.
        </p>
      </div>
    </div>
  );
}