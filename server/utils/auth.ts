import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "solian",
          clientId: process.env.SOLIAN_CLIENT_ID as string,
          clientSecret: process.env.SOLIAN_CLIENT_SECRET as string,
          discoveryUrl: "https://solian.app/.well-known/openid-configuration",
          scopes: ["openid", "profile", "email", "account.connections"],
          pkce: false,
        },
      ],
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});
