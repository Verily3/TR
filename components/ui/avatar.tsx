"use client";

import { forwardRef } from "react";

export interface AvatarProps {
  /** Name to generate initials from */
  name: string;
  /** Image URL (optional) */
  src?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Color variant (uses gradient if not specified) */
  variant?: "accent" | "gradient";
  /** Gradient index for consistent colors per user */
  gradientIndex?: number;
  /** Additional class name */
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
} as const;

const gradients = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
  "from-green-500 to-emerald-600",
  "from-red-500 to-pink-600",
] as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getGradientIndex(name: string, providedIndex?: number): number {
  if (providedIndex !== undefined) return providedIndex % gradients.length;
  // Generate consistent index from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % gradients.length;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      name,
      src,
      size = "md",
      variant = "gradient",
      gradientIndex,
      className = "",
    },
    ref
  ) => {
    const initials = getInitials(name);
    const colorIndex = getGradientIndex(name, gradientIndex);

    if (src) {
      return (
        <div
          ref={ref}
          className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}
        >
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    const bgClass =
      variant === "accent"
        ? "bg-accent text-accent-foreground"
        : `bg-gradient-to-br ${gradients[colorIndex]} text-white`;

    return (
      <div
        ref={ref}
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium flex-shrink-0 shadow-sm ${bgClass} ${className}`}
        role="img"
        aria-label={name}
      >
        {initials}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
