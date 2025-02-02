"use client";

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Animated SVG */}
        <div className="relative mx-auto h-64 w-64">
          <svg
            className="absolute inset-14 m-auto animate-float"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <svg
              width="120" // Reduced width to 120
              height="120" // Reduced height to 120
              viewBox="0 0 120 120"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Glowing Triangle Background  */}
              <path
                d="M60 15L105 90H15L60 15Z" // Adjusted points for smaller size
                stroke="url(#glow)"
                strokeWidth="6"
                fill="rgba(255, 251, 235, 0.1)"
                strokeLinejoin="round"
                filter="url(#shadow)"
              />

              {/* Inner Triangle (Adding depth)  */}
              <path
                d="M60 25L95 85H25L60 25Z" // Adjusted proportionally
                stroke="rgba(245, 158, 11, 0.8)"
                strokeWidth="4"
                fill="rgba(255, 251, 235, 0.2)"
                strokeLinejoin="round"
              />

              {/* Glowing Exclamation Mark  */}
              <line
                x1="60"
                y1="50"
                x2="60"
                y2="70"
                stroke="rgba(217, 119, 6, 0.9)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle
                cx="60"
                cy="80"
                r="6"
                fill="rgba(217, 119, 6, 0.9)"
                filter="url(#glowBlur)"
              />

              {/* SVG Filters for Glow & Shadow Effects  */}
              <defs>
                <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>

                <filter
                  id="shadow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feDropShadow
                    dx="0"
                    dy="0"
                    stdDeviation="5"
                    floodColor="#F59E0B"
                    floodOpacity="0.8"
                  />
                </filter>

                <filter
                  id="glowBlur"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>
          </svg>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Oops! Something went wrong.
          </h1>
          <p className="text-gray-600">
            We encountered an unexpected issue. Don't worry, you can try
            refreshing the page or contact the administrator.
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => window.location.reload()}
          className="group relative w-full flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 ease-in-out shadow-sm hover:shadow-md"
        >
          <svg
            className="h-5 w-5 mr-2 group-hover:animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh Page
        </button>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
