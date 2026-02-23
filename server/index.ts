import { config } from 'dotenv';
config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

import { generateUserProfileOG, generateUserBoardOG, generateMessageOG, generateAnonymousLinkOG, generateLandingPageOG, generateDashboardOG, generateLeaderboardOG, generatePersonalArchiveOG, generateAdminDashboardOG, generateAdminProfileOG, generateHomePageOG, generatePasswordManagementOG } from "./dynamic-meta";
import { storage } from "./storage";

(async () => {
  const server = await registerRoutes(app);

  // Dynamic Link Previews Middleware
  app.get("*", async (req, res, next) => {
    // Skip API, static files, and common asset extensions
    if (req.path.startsWith("/api") || 
        req.path.includes(".") || 
        req.headers.accept?.includes("application/json")) {
      return next();
    }

    let meta: any = null;
    const path = req.path;

    try {
      if (path === "/" || path === "/home") {
        meta = generateHomePageOG();
      } else if (path === "/dashboard") {
        meta = generateDashboardOG();
      } else if (path === "/leaderboard") {
        meta = generateLeaderboardOG();
      } else if (path === "/personal") {
        meta = generatePersonalArchiveOG();
      } else if (path === "/admin") {
        meta = generateAdminDashboardOG();
      } else if (path === "/password-management") {
        meta = generatePasswordManagementOG();
      } else if (path.startsWith("/user/")) {
        const username = path.split("/")[2];
        if (username) {
          const user = await storage.getUserByUsername(username);
          if (user) meta = generateUserProfileOG(user);
        }
      } else if (path.startsWith("/board/")) {
        const username = path.split("/")[2];
        if (username) {
          let user = await storage.getUserByUsername(username);
          if (!user) user = await storage.getAdminByUsername(username);
          if (user) meta = generateUserBoardOG(user);
        }
      } else if (path.startsWith("/admin/")) {
        const username = path.split("/")[2];
        if (username) {
          const admin = await storage.getAdminByUsername(username);
          if (admin) meta = generateAdminProfileOG(admin);
        }
      } else if (path.startsWith("/u/")) {
        const username = path.split("/")[2];
        if (username) meta = generateAnonymousLinkOG(username);
      } else if (path.startsWith("/message/")) {
        const id = parseInt(path.split("/")[2]);
        if (!isNaN(id)) {
          const message = await storage.getMessageById(id);
          if (message) meta = generateMessageOG(message);
        }
      }
    } catch (e) {
      console.error("Error generating dynamic meta:", e);
    }

    if (meta) {
      try {
        const indexFilePath = require("path").resolve(process.cwd(), "dist", "public", "index.html");
        const exists = require("fs").existsSync(indexFilePath);
        
        if (exists) {
          const indexFile = require("fs").readFileSync(indexFilePath, "utf8");
          const rendered = indexFile
            .replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`)
            .replace(/<meta name="description".*?>/, `<meta name="description" content="${meta.description}">`)
            .replace(/<meta property="og:title".*?>/, `<meta property="og:title" content="${meta.title}">`)
            .replace(/<meta property="og:description".*?>/, `<meta property="og:description" content="${meta.description}">`)
            .replace(/<meta property="og:image".*?>/, `<meta property="og:image" content="${meta.image}">`)
            .replace(/<meta property="og:url".*?>/, `<meta property="og:url" content="${req.protocol}://${req.get('host')}${meta.url}">`)
            .replace(/<meta property="og:type".*?>/, `<meta property="og:type" content="website">`)
            .replace(/<meta name="twitter:card".*?>/, `<meta name="twitter:card" content="summary_large_image">`)
            .replace(/<meta name="twitter:title".*?>/, `<meta name="twitter:title" content="${meta.title}">`)
            .replace(/<meta name="twitter:description".*?>/, `<meta name="twitter:description" content="${meta.description}">`)
            .replace(/<meta name="twitter:image".*?>/, `<meta name="twitter:image" content="${meta.image}">`)
            .replace(/<link rel="canonical".*?>/, `<link rel="canonical" href="${req.protocol}://${req.get('host')}${meta.url}">`);
          
          res.setHeader("Content-Type", "text/html");
          return res.send(rendered);
        }
      } catch (err) {
        console.error("Error reading index.html for meta tags:", err);
      }
    }

    next();
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();