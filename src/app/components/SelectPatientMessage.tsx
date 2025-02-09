const SelectPatientMessage = () => {
  return (
    <div className="relative px-8 py-20 rounded-2xl border text-zinc-800 border-white/10 shadow-2xl">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl" />

      <div className="relative z-10 flex flex-col items-center space-y-6">

        {/* Enhanced medical icon */}
        <div className="relative w-40 h-40">
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 drop-shadow-lg"
          >
            {/* Main circle */}
            <circle cx="50" cy="40" r="28" fill="url(#mainGradient)" />

            {/* Body */}
            <path
              d="M30 60v24h40V60c0-8-8-14-20-14s-20 6-20 14z"
              fill="url(#mainGradient)"
            />

            {/* Cross symbol */}
            <path
              d="M50 68v8m4-4h-8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* ECG line */}
            <path
              d="M32 50h4v4h4v-4h4v8h4v-8h4v4h4v-4h4v8h4v-8h4v4h4v-4h4"
              stroke="#FF6B6B"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />

            <defs>
              <linearGradient id="mainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A5B4FC" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Text content */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-black">
            Patient Selection Required
          </h2>
          <p className="text-zinc-800 font-medium leading-relaxed">
            Choose a patient record from the directory to access health profiles
          </p>
        </div>

        {/* Decorative divider */}
        <div className="w-24 h-1 bg-white/20 rounded-full" />
      </div>
    </div>
  );
};

export default SelectPatientMessage;
