import { z } from "zod";

export const registerSchema = z
  .object({
    username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_ก-๙]+$/),
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72)
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "Passwords do not match" });
    }
    if (!/[A-Z]/.test(data.password) || !/[a-z]/.test(data.password) || !/\d/.test(data.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password must include uppercase, lowercase, and number"
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});

export const chatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().trim().min(1).max(4000),
  imageUrl: z.string().url().optional()
});

export const conversationCreateSchema = z.object({
  title: z.string().trim().min(1).max(80).default("บทสนทนาใหม่")
});

export const conversationUpdateSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  pinned: z.boolean().optional()
});

export const settingsSchema = z.object({
  theme: z.enum(["system", "light", "dark"]).optional(),
  language: z.enum(["th", "en"]).optional(),
  aiModel: z.enum(["AUTO", "GEMINI", "OPENAI"]).optional()
});
