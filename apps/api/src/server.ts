import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const server = app.listen(env.PORT, () => {
  console.log(`API ready on http://localhost:${env.PORT}`);
});

let isShuttingDown = false;
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    server.close(() => {
      void prisma.$disconnect().finally(() => {
        process.exitCode = 0;
      });
    });
  });
}
