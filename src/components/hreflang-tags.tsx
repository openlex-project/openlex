import { headers } from "next/headers";

const locales = (process.env.NEXT_PUBLIC_LOCALES ?? "en").split(",");
const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en";

export async function HreflangTags() {
  if (locales.length <= 1) return null;
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;
  const pathname = h.get("x-invoke-path") ?? h.get("x-matched-path") ?? "/";
  const clean = locales.reduce((p, l) => p.replace(new RegExp(`^/${l}(/|$)`), "$1"), pathname) || "/";

  return (
    <>
      {locales.map((l) => (
        <link key={l} rel="alternate" hrefLang={l} href={`${base}${l === defaultLocale ? clean : `/${l}${clean}`}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${base}${clean}`} />
    </>
  );
}
