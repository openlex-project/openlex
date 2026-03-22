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
import { storeUserEmail } from "@/lib/kv";

const providers: AuthOptions["providers"] = [];

/* ─── Well-known providers (auto-detected from env vars) ─── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wellKnown: { prefix: string; factory: (id: string, secret: string) => any }[] = [
  { prefix: "OAUTH_GITHUB", factory: (id, secret) => GitHubProvider({ clientId: id, clientSecret: secret }) },
  { prefix: "OAUTH_GOOGLE", factory: (id, secret) => GoogleProvider({ clientId: id, clientSecret: secret }) },
  { prefix: "OAUTH_APPLE", factory: (id, secret) => AppleProvider({ clientId: id, clientSecret: secret }) },
  { prefix: "OAUTH_AZURE", factory: (id, secret) => AzureADProvider({ clientId: id, clientSecret: secret, tenantId: process.env.OAUTH_AZURE_TENANT ?? "common" }) },
  { prefix: "OAUTH_KEYCLOAK", factory: (id, secret) => KeycloakProvider({ clientId: id, clientSecret: secret, issuer: process.env.OAUTH_KEYCLOAK_ISSUER ?? "" }) },
  { prefix: "OAUTH_OKTA", factory: (id, secret) => OktaProvider({ clientId: id, clientSecret: secret, issuer: process.env.OAUTH_OKTA_ISSUER ?? "" }) },
  { prefix: "OAUTH_AUTH0", factory: (id, secret) => Auth0Provider({ clientId: id, clientSecret: secret, issuer: process.env.OAUTH_AUTH0_ISSUER ?? "" }) },
  { prefix: "OAUTH_GITLAB", factory: (id, secret) => GitLabProvider({ clientId: id, clientSecret: secret }) },
  { prefix: "OAUTH_COGNITO", factory: (id, secret) => CognitoProvider({ clientId: id, clientSecret: secret, issuer: process.env.OAUTH_COGNITO_ISSUER ?? "" }) },
];

for (const { prefix, factory } of wellKnown) {
  const id = process.env[`${prefix}_ID`];
  const secret = process.env[`${prefix}_SECRET`];
  if (id && secret) providers.push(factory(id, secret));
}

/* ─── Generic OIDC (custom SSO) ─── */
// Supports OAUTH_OIDC_1_*, OAUTH_OIDC_2_*, etc. for multiple custom providers
for (let i = 1; i <= 5; i++) {
  const prefix = `OAUTH_OIDC_${i}`;
  const id = process.env[`${prefix}_ID`];
  const secret = process.env[`${prefix}_SECRET`];
  const issuer = process.env[`${prefix}_ISSUER`];
  const name = process.env[`${prefix}_NAME`] ?? `SSO ${i}`;
  if (id && secret && issuer) {
    providers.push({
      id: `oidc-${i}`,
      name,
      type: "oauth",
      wellKnown: `${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`,
      clientId: id,
      clientSecret: secret,
      idToken: true,
      profile(profile) {
        return { id: profile.sub, name: profile.name ?? profile.preferred_username, email: profile.email, image: profile.picture };
      },
    });
  }
}

export const authOptions: AuthOptions = {
  providers,
  pages: { signIn: "/login" },
  events: {
    async signIn({ user }) {
      if (user.email) {
        await storeUserEmail(user.email, user.name ?? undefined).catch(() => {});
      }
    },
  },
};
