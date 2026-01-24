// src/app/components/GlobalOverlay.tsx
"use client";

import Image from "next/image";
import AIAssistant from "./aiAgent";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

export default function GlobalOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {/* Floating AI Chat Button */}
      {isOpen && (
        <div className="animate-slide-up">
          <AIAssistant />
        </div>
      )}

      {/* Toggle AI Assistant Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-lg hover:scale-110 transition-transform text-white"
        aria-label="Toggle AI Assistant"
      >
        <MessageCircle size={28} />
      </button>
      <a
        href="https://wa.me/917895927366" // Change number if needed
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          src="/icons/WhatsApp.png" // Make sure you have this icon in /public/icons/
          alt="Chat on WhatsApp"
          width={56}
          height={56}
          className="rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform"
        />
      </a>
    </div>
  );
}
