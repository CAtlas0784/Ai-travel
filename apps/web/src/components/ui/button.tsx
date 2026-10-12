import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" && "h-11 px-4 text-sm",
        size === "sm" && "h-9 px-3 text-xs",
        size === "icon" && "h-9 w-9 p-0",
        variant === "primary" && "bg-primary text-white shadow-soft hover:bg-green-700",
        variant === "secondary" && "border border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10",
        variant === "danger" && "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-200",
        className
      )}
      {...props}
    />
  );
}
