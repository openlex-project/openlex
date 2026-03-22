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
  return <span> · {license}</span>;
}
