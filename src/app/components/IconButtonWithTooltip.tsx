// components/IconButtonWithTooltip.tsx
import { ReactNode } from "react";
import Link from "next/link";

interface IconButtonWithTooltipProps {
  href: string;
  tooltip: string;
  icon: ReactNode;
  hoverBgColor?: string;
}

export default function IconButtonWithTooltip({
  href,
  tooltip,
  icon,
  hoverBgColor = "bg-teal-600",
}: IconButtonWithTooltipProps) {
  return (
    <div className="relative group">
      <Link href={href}>
        <div className={`p-1 rounded-full hover:${hoverBgColor} group`}>
          {icon}
        </div>
      </Link>
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
        {tooltip}
      </div>
    </div>
  );
}
