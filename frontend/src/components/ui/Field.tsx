import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";

const baseInputClasses =
  "w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-ink-100 disabled:text-ink-400";

export function Label({ children, hint, required }: { children: ReactNode; hint?: string; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-ink-700">
      {children}
      {required && <span className="ml-0.5 text-bad-600">*</span>}
      {hint && <span className="ml-1.5 font-normal text-ink-400">{hint}</span>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...rest }, ref) => (
    <input ref={ref} className={`${baseInputClasses} ${className}`} {...rest} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", ...rest }, ref) => (
    <textarea ref={ref} className={`${baseInputClasses} ${className}`} {...rest} />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", children, ...rest }, ref) => (
    <select ref={ref} className={`${baseInputClasses} ${className}`} {...rest}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="mt-1 text-xs font-medium text-bad-600">{children}</p>;
}

export function FormRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
