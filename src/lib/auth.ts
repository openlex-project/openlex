import type { AuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";

const providers: AuthOptions["providers"] = [];

if (process.env.OAUTH_GITHUB_ID && process.env.OAUTH_GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.OAUTH_GITHUB_ID,
      clientSecret: process.env.OAUTH_GITHUB_SECRET,
    }),
  );
}

if (process.env.OAUTH_GOOGLE_ID && process.env.OAUTH_GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.OAUTH_GOOGLE_ID,
      clientSecret: process.env.OAUTH_GOOGLE_SECRET,
    }),
  );
}

if (process.env.OAUTH_APPLE_ID && process.env.OAUTH_APPLE_SECRET) {
  providers.push(
    AppleProvider({
      clientId: process.env.OAUTH_APPLE_ID,
      clientSecret: process.env.OAUTH_APPLE_SECRET,
    }),
  );
}

export const authOptions: AuthOptions = {
  providers,
  pages: {
    signIn: "/login",
  },
};
