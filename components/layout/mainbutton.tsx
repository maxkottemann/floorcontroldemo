import { ComponentProps, ReactNode } from "react";

interface ButtonProps extends ComponentProps<"button"> {
  label: string;
  icon?: ReactNode;
  href?: string;
}

export default function MainButton({
  label,
  icon,
  href,
  ...rest
}: ButtonProps) {
  return (
    <a href={href}>
      <button
        {...rest}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-p hover:bg-ph active:scale-95 transition-all duration-150 cursor-pointer rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {icon && <span className="w-4 h-4">{icon}</span>}
        {label}
      </button>
    </a>
  );
}
