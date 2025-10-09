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
  hoverBgColor = "#14b8a6", // default teal color
  onClick,
}: IconButtonWithTooltipProps) {
  return (
    <div className="relative group inline-block">
      {href ? (
        <Link href={href}>
          <div
            style={{
              transition: "background-color 0.2s ease",
            }}
            className="p-1 rounded-full cursor-pointer group-hover:opacity-90"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.backgroundColor =
                hoverBgColor;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.backgroundColor = "";
            }}
          >
            {icon}
          </div>
        </Link>
      ) : (
        <div
          style={{
            transition: "background-color 0.2s ease",
          }}
          className="p-1 rounded-full cursor-pointer group-hover:opacity-90"
          onClick={onClick}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.backgroundColor =
              hoverBgColor;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.backgroundColor = "";
          }}
        >
          {icon}
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
        {tooltip}
      </div>
    </div>
  );
}
