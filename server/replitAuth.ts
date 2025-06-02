// server/replitAuth.ts

import * as openid from "openid-client";    // default ESM import
const { Issuer, generators } = openid;  // destructure methods you need

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage.js";

// ───────────────────────────────────────────────────────────────────────────────
// 1) Validate environment variables
// ───────────────────────────────────────────────────────────────────────────────
const OIDC_ISSUER = process.env.OIDC_ISSUER!;
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID!;
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET!;
const OIDC_CALLBACK_URL = process.env.OIDC_CALLBACK_URL!;

if (!OIDC_ISSUER || !OIDC_CLIENT_ID || !OIDC_CLIENT_SECRET || !OIDC_CALLBACK_URL) {
  throw new Error("Missing OIDC configuration environment variables");
}

// ───────────────────────────────────────────────────────────────────────────────
// 2) Auth0‐specific configuration
// ───────────────────────────────────────────────────────────────────────────────
const AUTH0_SCOPES = "openid profile email offline_access";
const AUTH0_CONNECTION = "Username-Password-Authentication";

// ───────────────────────────────────────────────────────────────────────────────
// 3) OIDC Client setup (memoized so we don’t re‐discover on every request)
// ───────────────────────────────────────────────────────────────────────────────
type OidcClient = openid.Client;

const getOidcClient = memoize(
  async (): Promise<OidcClient> => {
    // Discover returns an Issuer instance:
    const issuer = await Issuer.discover(OIDC_ISSUER);
    return new issuer.Client({
      client_id: OIDC_CLIENT_ID,
      client_secret: OIDC_CLIENT_SECRET,
      redirect_uris: [OIDC_CALLBACK_URL],
      response_types: ["code"],
    });
  },
  { maxAge: 3600 * 1000 }
);

// ───────────────────────────────────────────────────────────────────────────────
// 4) Session configuration
// ───────────────────────────────────────────────────────────────────────────────
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const PgStore = connectPg(session);

  return session({
    secret: process.env.SESSION_SECRET!,
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

function updateUserSession(user: any, tokenSet: openid.TokenSet) {
  user.claims = tokenSet.claims();
  user.access_token = tokenSet.access_token;
  user.refresh_token = tokenSet.refresh_token;
  user.expires_at = tokenSet.expires_at;
}

async function upsertUser(claims: Record<string, any>) {
  await storage.upsertUser({
    id: claims.sub,
    email: claims.email,
    firstName: claims.given_name || claims.nickname || "",
    lastName: claims.family_name || "",
    profileImageUrl: claims.picture || "",
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// 5) setupAuth: plug Passport + Express + the openid-client Strategy
// ───────────────────────────────────────────────────────────────────────────────
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const client = await getOidcClient();

  // The Passport strategy is available directly on openid.Client.prototype.adapter.PassportStrategy
  const Strategy = (openid as any).Strategy as typeof passport.Strategy;
  // Alternatively, you can import the helper from the package's own types:
  // import { PassportStrategy } from "openid-client";

  const verify = async (
    tokenSet: openid.TokenSet,
    userinfo: Record<string, any>,
    done: (err: Error | null, user?: any) => void
  ) => {
    try {
      const user: any = {};
      updateUserSession(user, tokenSet);
      await upsertUser(tokenSet.claims());
      return done(null, user);
    } catch (err) {
      return done(err as Error);
    }
  };

  // Construct the Passport strategy
  passport.use(
    "auth0",
    new Strategy(
      {
        client,
        params: {
          scope: AUTH0_SCOPES,
          connection: AUTH0_CONNECTION,
        },
      },
      verify
    )
  );

  passport.serializeUser((user: Express.User, done) => done(null, user));
  passport.deserializeUser((user: Express.User, done) => done(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate("auth0", { prompt: "login" })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate("auth0", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/login-error",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        `${OIDC_ISSUER}v2/logout?` +
          new URLSearchParams({
            client_id: OIDC_CLIENT_ID,
            returnTo: `${req.protocol}://${req.hostname}`,
          }).toString()
      );
    });
    req.logout(); // remove the callback
    res.redirect(
      `${OIDC_ISSUER}v2/logout?` +
        new URLSearchParams({
          client_id: OIDC_CLIENT_ID,
          returnTo: `${req.protocol}://${req.hostname}`,
        }).toString()
    );
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const client = await getOidcClient();
    const newTokenSet = await (client as OidcClient).refresh(refreshToken);
    updateUserSession(user, newTokenSet);
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
