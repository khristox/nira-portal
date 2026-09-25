import DOMPurify from "isomorphic-dompurify";

export default function RichContent({ html }: { html: string }) {
  if (!html?.trim()) return null;

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "code", "pre",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "blockquote", "hr",
      "a", "img", "table", "thead", "tbody", "tr", "th", "td",
      "span", "div", "small", "sup", "sub",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "src", "alt", "title",
      "class", "id", "style", "colspan", "rowspan",
    ],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });

  // No prose classes — HTML styles are preserved as-is
  return (
    <div
      className="rich-content text-gray-800 dark:text-gray-200"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}