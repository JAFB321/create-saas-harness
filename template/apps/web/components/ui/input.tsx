import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]",
          className,
        )}
        {...props}
      />
    );
  },
);
