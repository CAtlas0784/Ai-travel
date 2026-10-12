import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-slate-200 bg-white/80 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-green-100 dark:border-white/10 dark:bg-white/5 dark:focus:ring-green-950",
        className
      )}
      {...props}
    />
  );
}
