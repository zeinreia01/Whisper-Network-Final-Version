import { config } from 'dotenv';
config({ override: true });

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware for API requests
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

      console.log(logLine);
    }
  });

  next();
});

// Initialize routes asynchronously
let isRouteRegistered = false;

const initializeRoutes = async () => {
  if (!isRouteRegistered) {
    await registerRoutes(app);
    isRouteRegistered = true;
  }
};

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json({ message });
  console.error(err);
});

// Middleware to ensure routes are registered before handling requests
app.use(async (req, res, next) => {
  await initializeRoutes();
  next();
});

// For Vercel, we export the app
export default app;