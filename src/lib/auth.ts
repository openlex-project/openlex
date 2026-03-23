import type { AuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import AzureADProvider from "next-auth/providers/azure-ad";
import KeycloakProvider from "next-auth/providers/keycloak";
import OktaProvider from "next-auth/providers/okta";
import Auth0Provider from "next-auth/providers/auth0";
import GitLabProvider from "next-auth/providers/gitlab";
import CognitoProvider from "next-auth/providers/cognito";
import { storeUserEmail } from "@/lib/redis";
import { log } from "@/lib/logger";

/* ─── Provider factories ─── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FACTORIES: Record<string, (slot: SlotEnv) => any> = {
  github: (s) => GitHubProvider({ clientId: s.id, clientSecret: s.secret }),
  google: (s) => GoogleProvider({ clientId: s.id, clientSecret: s.secret }),
  apple: (s) => AppleProvider({ clientId: s.id, clientSecret: s.secret }),
  azure: (s) => AzureADProvider({ clientId: s.id, clientSecret: s.secret, tenantId: s.extra.TENANT ?? "common" }),
  gitlab: (s) => GitLabProvider({ clientId: s.id, clientSecret: s.secret }),
  keycloak: (s) => KeycloakProvider({ clientId: s.id, clientSecret: s.secret, issuer: s.issuer! }),
  okta: (s) => OktaProvider({ clientId: s.id, clientSecret: s.secret, issuer: s.issuer! }),
  auth0: (s) => Auth0Provider({ clientId: s.id, clientSecret: s.secret, issuer: s.issuer! }),
  cognito: (s) => CognitoProvider({ clientId: s.id, clientSecret: s.secret, issuer: s.issuer! }),
  oidc: (s) => ({
    id: `oidc-${s.slot}`,
    name: s.name ?? `SSO ${s.slot}`,
    type: "oauth" as const,
    wellKnown: `${s.issuer!.replace(/\/$/, "")}/.well-known/openid-configuration`,
    clientId: s.id,
    clientSecret: s.secret,
    idToken: true,
    profile(profile: Record<string, string>) {
      return { id: profile.sub, name: profile.name ?? profile.preferred_username, email: profile.email, image: profile.picture };
    },
  }),
};

interface SlotEnv {
  slot: number;
  id: string;
  secret: string;
  provider: string;
  issuer?: string;
  name?: string;
  extra: Record<string, string>;
}

function readSlot(n: number): SlotEnv | null {
  const id = process.env[`OAUTH_${n}_ID`];
  const secret = process.env[`OAUTH_${n}_SECRET`];
  if (!id || !secret) return null;

  const issuer = process.env[`OAUTH_${n}_ISSUER`];
  const provider = process.env[`OAUTH_${n}_PROVIDER`] ?? (issuer ? "oidc" : null);
  if (!provider) return null;

  const extra: Record<string, string> = {};
  for (const [key, val] of Object.entries(process.env)) {
    if (key.startsWith(`OAUTH_${n}_`) && val && !["ID", "SECRET", "ISSUER", "PROVIDER", "NAME"].includes(key.replace(`OAUTH_${n}_`, ""))) {
      extra[key.replace(`OAUTH_${n}_`, "")] = val;
    }
  }

  return { slot: n, id, secret, provider, issuer, name: process.env[`OAUTH_${n}_NAME`], extra };
}

/* ─── Build providers list ─── */

const providers: AuthOptions["providers"] = [];

for (let i = 1; i <= 10; i++) {
  const slot = readSlot(i);
  if (!slot) continue;
  const factory = FACTORIES[slot.provider];
  if (!factory) { log.warn("Unknown OAuth provider: %s (slot %d)", slot.provider, i); continue; }
  if (["keycloak", "okta", "auth0", "cognito", "oidc"].includes(slot.provider) && !slot.issuer) {
    log.warn("OAuth slot %d (%s) requires OAUTH_%d_ISSUER", i, slot.provider, i); continue;
  }
  providers.push(factory(slot));
}

export const authOptions: AuthOptions = {
  providers,
  pages: { signIn: "/login" },
  events: {
    async signIn({ user }) {
      if (user.email) {
        await storeUserEmail(user.email, user.name ?? undefined).catch((err) => log.error(err, "Failed to store user email"));
      }
    },
  },
};
