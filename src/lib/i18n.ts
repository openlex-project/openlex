import { loadSiteConfig } from "./site";

export const defaultLocale = loadSiteConfig().default_locale;
export const locales = ["de", "en"] as const;
export type Locale = (typeof locales)[number];

const dictionaries: Record<Locale, Record<string, string>> = {
  de: {
    "nav.search": "Suche…",
    "nav.login": "Anmelden",
    "nav.logout": "Abmelden",
    "search.title": "Suchergebnisse",
    "search.placeholder": "Suchbegriff eingeben.",
    "search.loading": "Suche…",
    "search.empty": 'Keine Ergebnisse für \u201E{q}\u201C.',
    "feedback.title": "Feedback",
    "feedback.placeholder": "Ihr Kommentar…",
    "feedback.cancel": "Abbrechen",
    "feedback.send": "Senden",
    "feedback.sent": "✓ Gesendet",
    "feedback.error": "Fehler",
    "feedback.addition": "Ergänzung",
    "feedback.question": "Frage",
    "section.books": "Kommentare & Bücher",
    "section.journals": "Zeitschriften",
    "section.laws": "Gesetze",
    "law.link": "Gesetzestext →",
    "skip": "Zum Inhalt springen",
    "home.aria": "Startseite",
    "commentary.on": "Kommentar zu {slug}",
    "issues.count": "{n} Hefte",
    "issue.label": "Heft {issue}/{year}",
    "issue.word": "Heft",
    "edition.label": "{ref}. Auflage",
  },
  en: {
    "nav.search": "Search…",
    "nav.login": "Sign in",
    "nav.logout": "Sign out",
    "search.title": "Search results",
    "search.placeholder": "Enter search term.",
    "search.loading": "Searching…",
    "search.empty": "No results for \"{q}\".",
    "feedback.title": "Feedback",
    "feedback.placeholder": "Your comment…",
    "feedback.cancel": "Cancel",
    "feedback.send": "Submit",
    "feedback.sent": "✓ Sent",
    "feedback.error": "Error",
    "feedback.addition": "Suggestion",
    "feedback.question": "Question",
    "section.books": "Commentaries & Books",
    "section.journals": "Journals",
    "section.laws": "Laws",
    "law.link": "Legal text →",
    "skip": "Skip to content",
    "home.aria": "Home",
    "commentary.on": "Commentary on {slug}",
    "issues.count": "{n} issues",
    "issue.label": "Issue {issue}/{year}",
    "issue.word": "Issue",
    "edition.label": "{ref}th edition",
  },
};

export function t(locale: Locale, key: string, params?: Record<string, string>): string {
  const site = loadSiteConfig();
  // Dynamic keys from site config
  if (key === "site.title") return site.name;
  if (key === "site.tagline") return site.tagline[locale] ?? site.tagline[defaultLocale] ?? "";
  if (key === "footer.copy") return `© ${site.copyright}`;

  let str = dictionaries[locale]?.[key] ?? dictionaries[defaultLocale as Locale][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}
