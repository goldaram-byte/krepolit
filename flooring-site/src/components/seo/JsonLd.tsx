// Escaping "<" prevents a value containing "</script>" (e.g. a product name
// pulled from a supplier feed) from breaking out of the script tag — the
// standard mitigation for embedding untrusted data as inline JSON-LD.
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}
