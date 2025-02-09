// app/loading.tsx
"use client";

import { useEffect, useState } from "react";

export default function Loading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
      <div className="relative w-64 h-64">
        {/* Outer Pulse Circle */}
        <div className="absolute inset-0 animate-pulse">
          <div className="h-full w-full rounded-full bg-blue-200 opacity-70" />
        </div>

        {/* Spinning Medical Symbol */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin slow-spin">
            <svg
              className="w-24 h-24 text-blue-600"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M32 12V52M52 32H12M44 20L20 44M20 20L44 44"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-blue-900 font-semibold text-xl">{progress}%</div>
        </div>
      </div>

      {/* Animated Text */}
      <div className="mt-8 space-y-4">
        <h2 className="text-3xl font-bold text-blue-900 text-center animate-pulse">
          Healing Hands Clinic
        </h2>
        <p className="text-blue-600 text-center animate-breathe">
          Loading patient care...
        </p>
      </div>

      <style jsx global>{`
        @keyframes breathe {
          0% {
            opacity: 0.8;
            transform: scale(0.98);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0.8;
            transform: scale(0.98);
          }
        }

        @keyframes slow-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-breathe {
          animation: breathe 2s ease-in-out infinite;
        }

        .slow-spin {
          animation: slow-spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
