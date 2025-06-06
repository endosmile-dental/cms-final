import React from "react";
import SectionHeader from "./SectionHeader";

interface ContactInfoProps {
  icon: React.ReactNode;
  title: string;
  content: string;
}

const ContactInfo: React.FC<ContactInfoProps> = ({ icon, title, content }) => (
  <div>
    <SectionHeader icon={icon} title={title} />
    <ul className="space-y-3">
      <li className="p-2 bg-blue-50 rounded">{content}</li>
    </ul>
  </div>
);

export default ContactInfo;
