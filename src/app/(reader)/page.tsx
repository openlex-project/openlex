import Link from "next/link";
import { buildRegistry } from "@/lib/registry";

export default async function Home() {
  const { books, laws } = await buildRegistry();

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold">OpenLex</h1>
      <p className="mt-2 text-gray-600 mb-8">
        Open-Access-Plattform für juristische Fachliteratur
      </p>

      {books.size > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Kommentare &amp; Bücher</h2>
          <ul className="space-y-2">
            {[...books.values()].map((b) => (
              <li key={b.slug}>
                <Link
                  href={`/book/${b.slug}/5`}
                  className="text-blue-600 hover:underline"
                >
                  {b.abbreviation}
                </Link>
                <span className="text-gray-500 ml-2 text-sm">{b.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {laws.size > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Gesetze</h2>
          <ul className="space-y-2">
            {[...laws.values()].map((l) => (
              <li key={l.slug}>
                <Link
                  href={`/law/${l.slug}/5`}
                  className="text-blue-600 hover:underline"
                >
                  {l.abbreviation}
                </Link>
                <span className="text-gray-500 ml-2 text-sm">{l.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
