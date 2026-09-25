"use client";

export default function ChartEmbed({ url }: { url: string }) {
  if (!url?.trim()) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <iframe
        src={url}
        title="Embedded chart"
        className="w-full h-[500px] border-0"
        sandbox="allow-scripts allow-same-origin allow-popups"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}