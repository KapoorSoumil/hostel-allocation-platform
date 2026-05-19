import { app } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { env } from "./config/env";
import { initializeRealtime } from "./realtime/realtime.service";
import { logger } from "./utils/logger";

async function bootstrap() {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
  });
  initializeRealtime(server);

  const shutdown = async () => {
    logger.info("Shutting down server");
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  logger.error(error, "Failed to start server");
  process.exit(1);
});
