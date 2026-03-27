import Link from "next/link";

const locales = (process.env.NEXT_PUBLIC_LOCALES ?? "en").split(",");
const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en";

/** Inline language links for the meta line: " · EN · FR". Uses <a> for full page load (middleware rewrite). */
export function ContentLanguageLinks({ translations, currentPath }: {
  translations?: string[];
  currentPath: string;
}) {
  if (!translations?.length) return null;

  const contentLocale = locales.find((l) => currentPath.startsWith(`/${l}/`)) ?? defaultLocale;
  const others = [defaultLocale, ...translations].filter((l) => l !== contentLocale);
  if (!others.length) return null;

  const buildHref = (l: string) => {
    const clean = locales.reduce((p, loc) => p.replace(new RegExp(`^/${loc}(/|$)`), "$1"), currentPath) || "/";
    return l === defaultLocale ? clean : `/${l}${clean}`;
  };

  return (
    <>
      {others.map((l) => (
        <span key={l}> · <a href={buildHref(l)} className="uppercase hover:underline" style={{ color: "var(--active-text)" }}>{l}</a></span>
      ))}
    </>
  );
}
