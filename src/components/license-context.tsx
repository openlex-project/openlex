"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocale } from "./locale-provider";

const Ctx = createContext<{ license: string; set: (v: string) => void }>({ license: "", set: () => {} });

export function LicenseProvider({ children }: { children: ReactNode }) {
  const [license, set] = useState("");
  return <Ctx value={{ license, set }}>{children}</Ctx>;
}

export function SetLicense({ value }: { value: string }) {
  const { set } = useContext(Ctx);
  useEffect(() => { set(value); }, [value, set]);
  return null;
}

/** Map SPDX CC identifiers to license path + icon keys */
function parseCcLicense(spdx: string): { path: string; icons: string[] } | null {
  const m = spdx.match(/^CC-(BY(?:-(?:SA|NC|ND|NC-SA|NC-ND))?)-(\d+\.\d+)$/i);
  if (!m) return null;
  const variant = m[1]!.toLowerCase();
  const version = m[2]!;
  const icons = ["cc", ...variant.split("-")];
  return { path: `${variant}/${version}`, icons };
}

/** Resolve CC deed URL with locale */
function ccDeedUrl(path: string, locale: string): string {
  const supported = ["de", "fr", "es", "it", "pt", "nl", "ja", "ko", "zh", "ar", "ru"];
  const lang = supported.includes(locale) ? locale : "en";
  return `https://creativecommons.org/licenses/${path}/deed.${lang}`;
}

const ICON_SIZE = 18;

/** CC icon SVGs — official paths from creativecommons.org */
function CcIcon({ type }: { type: string }) {
  const common = { xmlns: "http://www.w3.org/2000/svg", width: ICON_SIZE, height: ICON_SIZE, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true as const, className: "shrink-0" };
  switch (type) {
    case "cc":
      return (
        <svg {...common}>
          <title>Creative Commons</title>
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM10.3 9.2c-.8 0-1.4.3-1.8.8-.4.5-.6 1.2-.6 2s.2 1.5.6 2c.4.5 1 .8 1.8.8.5 0 1-.1 1.3-.4.3-.2.6-.6.7-1l-1.2-.4c-.1.2-.2.4-.3.5-.2.1-.3.2-.5.2-.4 0-.6-.2-.8-.5-.2-.3-.3-.7-.3-1.2s.1-.9.3-1.2c.2-.3.5-.5.8-.5.2 0 .4.1.5.2.2.1.3.3.3.5l1.2-.4c-.2-.4-.4-.8-.7-1-.4-.3-.8-.4-1.3-.4Zm5 0c-.8 0-1.4.3-1.8.8-.4.5-.6 1.2-.6 2s.2 1.5.6 2c.4.5 1 .8 1.8.8.5 0 1-.1 1.3-.4.3-.2.6-.6.7-1l-1.2-.4c-.1.2-.2.4-.3.5-.2.1-.3.2-.5.2-.4 0-.6-.2-.8-.5-.2-.3-.3-.7-.3-1.2s.1-.9.3-1.2c.2-.3.5-.5.8-.5.2 0 .4.1.5.2.2.1.3.3.3.5l1.2-.4c-.2-.4-.4-.8-.7-1-.4-.3-.8-.4-1.3-.4Z" />
        </svg>
      );
    case "by":
      return (
        <svg {...common}>
          <title>Attribution</title>
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM12 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-2.5 4v1.2h1.2V17h2.6v-6.3h1.2V9.5Z" />
        </svg>
      );
    case "sa":
      return (
        <svg {...common}>
          <title>ShareAlike</title>
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Zm-.2 4a4.3 4.3 0 0 0-4.3 4.5c0 2.5 1.8 4.5 4.3 4.5 1.7 0 3-.8 3.8-2.2l-1.7-1c-.4.8-1.1 1.3-2 1.3-1.4 0-2.4-1.1-2.4-2.6 0-1.5 1-2.6 2.3-2.6.9 0 1.6.5 2 1.3l1.8-1c-.8-1.4-2.1-2.2-3.8-2.2Z" />
        </svg>
      );
    case "nc":
      return (
        <svg {...common}>
          <title>NonCommercial</title>
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Zm-.5 4v1.3H9.8l-.3.7h2v1.3H8.3l-.3.7h5.5l1.5-3.3V7.5Zm-3.2 5 .3-.7h6.9l.3-.7H9l-1.5 3.3v.6h2.3v1.3h1.5v-1.3h1l.3-.7h-1.3v-1.3h1.7l.3-.7Z" />
        </svg>
      );
    case "nd":
      return (
        <svg {...common}>
          <title>NoDerivatives</title>
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM8 10v1.5h8V10Zm0 3v1.5h8V13Z" />
        </svg>
      );
    default:
      return null;
  }
}

export function LicenseDisplay() {
  const { license } = useContext(Ctx);
  const locale = useLocale();
  if (!license) return null;

  // Public domain — show localized label
  const pdLabels: Record<string, string> = { de: "Gemeinfrei", en: "Public Domain", fr: "Domaine public" };
  if (license.toLowerCase().includes("publicdomain") || license === "CC0-1.0") {
    return <span>{pdLabels[locale] ?? pdLabels.en}</span>;
  }

  const cc = parseCcLicense(license);
  if (!cc) return <span>{license}</span>;

  return (
    <a
      href={ccDeedUrl(cc.path, locale)}
      target="_blank"
      rel="noopener license"
      className="inline-flex items-center gap-0.5 hover:underline align-middle"
      title={license}
    >
      {cc.icons.map((icon) => <CcIcon key={icon} type={icon} />)}
      <span className="ml-1">{license}</span>
    </a>
  );
}
