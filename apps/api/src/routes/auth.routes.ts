import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { HttpError, asyncHandler } from "../lib/http.js";
import { loginSchema, registerSchema } from "../validation/schemas.js";
import { requireAuth, signAccessToken } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] }
    });

    if (existing?.email === input.email) throw new HttpError(409, "Duplicate email");
    if (existing?.username === input.username) throw new HttpError(409, "Duplicate username");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash,
        settings: { create: {} }
      },
      select: { id: true, email: true, username: true, avatarUrl: true }
    });

    res.status(201).json({ token: signAccessToken(user.id), user });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid email or password");
    }

    res.json({
      token: signAccessToken(user.id),
      user: { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl }
    });
  })
);

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
