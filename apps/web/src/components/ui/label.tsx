import type { LabelHTMLAttributes } from "react";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" {...props} />;
}
