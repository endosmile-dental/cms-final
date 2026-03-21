"use client";

import { Loader2 } from "lucide-react";
import { useMemo } from "react";

interface LoadingProps {
  loadingMessage?: boolean;
}

const DENTAL_MESSAGES = [
  // 🦷 Jokes
  "Brace yourself... loading!",
  "Tooth be told, we're almost there!",
  "Flossing through the data...",
  "This might take a molar-ment.",
  "Extracting information — pain-free, we promise!",
  "Hang tight... we're polishing the bytes!",
  "Our system doesn't have cavities, but it's filling in now.",
  "Just one more root to load...",
  "Getting to the root of it all...",
  "We're drilling through the data.",
  "Cleaning your data plaque…",
  "Injecting some anesthesia… just kidding!",
  "One second… we're counting your teeth!",
  "Fetching records with surgical precision.",

  // 😲 Facts
  "Did you know? Tooth enamel is the hardest substance in the human body.",
  "Sharks can grow over 20,000 teeth in a lifetime!",
  "Your mouth produces enough saliva in a lifetime to fill two swimming pools!",
  "The first bristle toothbrush was made in China — in 1498!",
  "The average person only brushes for 45–70 seconds a day — aim for 2 minutes!",
  "Elephants only get 6 sets of molars in their lifetime.",
  "A snail's mouth is no bigger than a pin, but it can have 25,000 teeth!",
  "There are more bacteria in your mouth than people on Earth.",
  "George Washington's dentures weren't wooden — they were made from animal and human teeth.",
];

export default function Loading({ loadingMessage = false }: LoadingProps) {
  const randomMessage = useMemo(() => {
    const index = Math.floor(Math.random() * DENTAL_MESSAGES.length);
    return DENTAL_MESSAGES[index];
  }, []);

  return (
    <div className="min-h-screen w-full z-50 flex flex-col items-center justify-center px-4">
      <div className="-mt-20 w-full flex flex-col justify-center items-center text-center gap-y-5">
        <Loader2 className="text-blue-500 w-12 h-12 animate-spin" />
        {loadingMessage && (
          <p className="text-lg text-gray-500 max-w-xl italic">
            &quot;{randomMessage}&quot;
          </p>
        )}
      </div>
    </div>
  );
}
