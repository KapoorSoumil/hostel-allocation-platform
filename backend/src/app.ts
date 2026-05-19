import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/not-found.middleware";
import { routes } from "./routes";
import { logger } from "./utils/logger";

export const app = express();

if (env.TRUST_PROXY) {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Hostel allocation backend is healthy"
  });
});

app.get("/ready", (_req, res) => {
  res.json({
    success: true,
    message: "Hostel allocation backend is ready"
  });
});

app.use("/api", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
