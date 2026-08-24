import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 focus-visible:outline-brand-700 disabled:bg-ink-300",
  secondary: "bg-ink-100 text-ink-700 hover:bg-ink-200 focus-visible:outline-ink-400",
  outline: "border border-ink-300 bg-white text-ink-700 hover:bg-ink-50 focus-visible:outline-ink-400",
  ghost: "text-ink-600 hover:bg-ink-100 focus-visible:outline-ink-400",
  danger: "bg-bad-600 text-white hover:bg-bad-700 focus-visible:outline-bad-600 disabled:bg-ink-300",
};

const SIZES: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs gap-1.5",
  md: "px-3.5 py-2 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, children, className = "", disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        {...rest}
      >
        {loading ? <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
