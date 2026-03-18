export const defaultLocale = "de";
export const locales = ["de", "en"] as const;
export type Locale = (typeof locales)[number];

const dictionaries: Record<Locale, Record<string, string>> = {
  de: {
    "site.title": "OpenLex",
    "site.tagline": "Open-Access-Plattform für juristische Fachliteratur",
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
    "section.laws": "Gesetze",
    "law.link": "Gesetzestext →",
    "footer.copy": "© OpenLex – CC-BY-SA-4.0",
  },
  en: {
    "site.title": "OpenLex",
    "site.tagline": "Open-access platform for legal literature",
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
    "section.laws": "Laws",
    "law.link": "Legal text →",
    "footer.copy": "© OpenLex – CC-BY-SA-4.0",
  },
};

export function t(locale: Locale, key: string, params?: Record<string, string>): string {
  let str = dictionaries[locale]?.[key] ?? dictionaries[defaultLocale][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}
