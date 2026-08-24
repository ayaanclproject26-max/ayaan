import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold uppercase tracking-wider text-sm transition-all duration-200 press-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "border border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
  };

  const widthClass = fullWidth ? "w-full" : "";

  const rootClass = `${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`;

  return (
    <button className={rootClass.trim()} {...props}>
      {children}
    </button>
  );
}
