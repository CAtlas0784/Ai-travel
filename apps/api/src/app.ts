import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import { conversationRouter } from "./routes/conversation.routes.js";
import { favoriteRouter } from "./routes/favorite.routes.js";
import { placeRouter } from "./routes/place.routes.js";
import { settingsRouter } from "./routes/settings.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { savedPlaceRouter } from "./routes/saved-place.routes.js";
import { errorHandler, notFound } from "./middleware/error.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(compression());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/conversations", conversationRouter);
app.use("/api/places", placeRouter);
app.use("/api/favorites", favoriteRouter);
app.use("/api/saved-places", savedPlaceRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/user", userRouter);
app.use(notFound);
app.use(errorHandler);
