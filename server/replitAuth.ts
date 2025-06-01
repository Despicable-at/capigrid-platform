import * as oidc from "openid-client";
import openid from "openid-client";
const { Strategy } = openid;
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Validate environment variables
const OIDC_ISSUER = process.env.OIDC_ISSUER!;
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID!;
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET!;
const OIDC_CALLBACK_URL = process.env.OIDC_CALLBACK_URL!;

if (!OIDC_ISSUER || !OIDC_CLIENT_ID || !OIDC_CLIENT_SECRET || !OIDC_CALLBACK_URL) {
  throw new Error("Missing OIDC configuration environment variables");
}

// Auth0-specific configuration
const AUTH0_SCOPES = "openid profile email offline_access";
const AUTH0_CONNECTION = "Username-Password-Authentication"; // Default Auth0 DB connection

// OIDC Client setup
const getOidcClient = memoize(
  async () => {
    const issuer = await oidc.Issuer.discover(OIDC_ISSUER);
    return new issuer.Client({
      client_id: OIDC_CLIENT_ID,
      client_secret: OIDC_CLIENT_SECRET,
      redirect_uris: [OIDC_CALLBACK_URL],
      response_types: ['code'],
    });
  },
  { maxAge: 3600 * 1000 }
);

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  return session({
    secret: process.env.SESSION_SECRET!,
    store: new pgStore({
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

function updateUserSession(user: any, tokenSet: oidc.TokenSet) {
  user.claims = tokenSet.claims();
  user.access_token = tokenSet.access_token;
  user.refresh_token = tokenSet.refresh_token;
  user.expires_at = tokenSet.expires_at;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims.sub,
    email: claims.email,
    firstName: claims.given_name || claims.nickname || "",
    lastName: claims.family_name || "",
    profileImageUrl: claims.picture || "",
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const client = await getOidcClient();

  const verify: oidc.VerifyCallback = async (tokenSet, _, done) => {
    try {
      const user = {};
      updateUserSession(user, tokenSet);
      await upsertUser(tokenSet.claims());
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  };

  const strategy = new openid.Strategy(
    {
      client,
      params: {
        scope: AUTH0_SCOPES,
        connection: AUTH0_CONNECTION, // Auth0-specific parameter
      },
    },
    verify
  );

  passport.use("auth0", strategy);
  passport.serializeUser((user: Express.User, done) => done(null, user));
  passport.deserializeUser((user: Express.User, done) => done(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate("auth0", {
      prompt: "login",
    })(req, res, next);
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
    const tokenSet = await client.refresh(refreshToken);
    updateUserSession(user, tokenSet);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
