"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

export function LicenseDisplay() {
  const { license } = useContext(Ctx);
  if (!license) return null;
  const l = license.toLowerCase().replace(/ /g, "-");
  const ccUrl = l.startsWith("cc-") ? `https://creativecommons.org/licenses/${l.replace("cc-", "")}/4.0/` : null;
  if (!ccUrl) return <span> · {license}</span>;
  return (
    <span> · <a href={ccUrl} target="_blank" rel="noopener license" className="inline-flex items-center gap-1 hover:underline">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM10.3 9.2c-.8 0-1.4.3-1.8.8-.4.5-.6 1.2-.6 2s.2 1.5.6 2c.4.5 1 .8 1.8.8.5 0 1-.1 1.3-.4.3-.2.6-.6.7-1l-1.2-.4c-.1.2-.2.4-.3.5-.2.1-.3.2-.5.2-.4 0-.6-.2-.8-.5-.2-.3-.3-.7-.3-1.2s.1-.9.3-1.2c.2-.3.5-.5.8-.5.2 0 .4.1.5.2.2.1.3.3.3.5l1.2-.4c-.2-.4-.4-.8-.7-1-.4-.3-.8-.4-1.3-.4Zm5 0c-.8 0-1.4.3-1.8.8-.4.5-.6 1.2-.6 2s.2 1.5.6 2c.4.5 1 .8 1.8.8.5 0 1-.1 1.3-.4.3-.2.6-.6.7-1l-1.2-.4c-.1.2-.2.4-.3.5-.2.1-.3.2-.5.2-.4 0-.6-.2-.8-.5-.2-.3-.3-.7-.3-1.2s.1-.9.3-1.2c.2-.3.5-.5.8-.5.2 0 .4.1.5.2.2.1.3.3.3.5l1.2-.4c-.2-.4-.4-.8-.7-1-.4-.3-.8-.4-1.3-.4Z"/>
      </svg>
      {license}
    </a></span>
  );
}
