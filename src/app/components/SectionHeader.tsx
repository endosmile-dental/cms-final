import React from "react";

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title }) => (
  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
    {icon}
    {title}
  </h2>
);

export default SectionHeader;
