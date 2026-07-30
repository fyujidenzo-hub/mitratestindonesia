import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { ZodError } from "zod";
import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import customerRoutes from "./routes/customer.js";
import adminRoutes from "./routes/admin.js";
import { HttpError } from "./lib/http.js";

const app = express();
const port = Number(process.env.PORT || 3001);

app.set("trust proxy", 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use("/api", rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: "draft-8", legacyHeaders: false }));

app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/admin", adminRoutes);

if (process.env.NODE_ENV === "production") {
  const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
  const clientDistCandidates = [
    path.resolve(moduleDirectory, "../client"),
    path.resolve(process.cwd(), "client/dist"),
    path.resolve(process.cwd(), "../client/dist"),
    path.resolve(moduleDirectory, "../../../client/dist"),
  ];
  const clientDist = clientDistCandidates.find((candidate) =>
    existsSync(path.join(candidate, "index.html")),
  );

  if (!clientDist) {
    console.error("Client build not found. Checked:", clientDistCandidates);
  }

  app.use(
    express.static(clientDist || path.resolve(moduleDirectory, "../client"), {
      index: false,
      maxAge: "1h",
    }),
  );

  app.use((_request, response, next) => {
    if (!clientDist) {
      return next(new Error("The client application was not included in the production build."));
    }
    return response
      .set("Cache-Control", "no-cache")
      .sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return response.status(400).json({ error: "The submitted data is incomplete or invalid.", details: error.issues });
  }
  if (error instanceof HttpError) return response.status(error.status).json({ error: error.message });
  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    return response.status(409).json({ error: "That information is already in use." });
  }
  console.error(error);
  response.status(500).json({ error: "A server error occurred." });
});

const host = process.env.HOST || "0.0.0.0";
app.listen(port, host, () => {
  console.log(`Shopee Work API running at http://${host}:${port}`);
});
