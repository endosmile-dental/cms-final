import { ReactNode } from "react";
import Link from "next/link";

interface IconButtonWithTooltipProps {
  href?: string;
  tooltip: string;
  icon: ReactNode;
  hoverBgColor?: string; // Accept any color (Tailwind, HEX, RGB, etc.)
  onClick?: () => void; // optional for non-link buttons
}

export default function IconButtonWithTooltip({
  href,
  tooltip,
  icon,
  hoverBgColor = "bg-teal-500", // default teal color using Tailwind class
  onClick,
}: IconButtonWithTooltipProps) {
  return (
    <div className="relative group inline-block">
      {href ? (
        <Link href={href}>
          <div
            className={`p-1 rounded-full cursor-pointer transition-colors duration-200 ${hoverBgColor} hover:opacity-90`}
          >
            {icon}
          </div>
        </Link>
      ) : (
        <div
          className={`p-1 rounded-full cursor-pointer transition-colors duration-200 ${hoverBgColor} hover:opacity-90`}
          onClick={onClick}
        >
          {icon}
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
        {tooltip}
      </div>
    </div>
  );
}
