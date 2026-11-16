import React from "react";

export default function BibleToday() {
  return (
    <div className="bg-[#F7F4EF] min-h-screen font-sans text-[#1A1A1A]">
      {/* Phone frame */}
      <div className="mx-auto max-w-[390px] min-h-[844px] relative overflow-hidden">
        {/* Top bar */}
        <header className="px-4 pt-6 pb-2 flex items-center justify-between">
          <div className="flex gap-4">
            <button className="text-[#1A1A1A] font-bold text-sm border-b-2 border-[#EF4444] pb-1">
              Today
            </button>
            <button className="text-[#8C8C8C] text-sm">
              Community
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[#8C8C8C] text-xs font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>26</span>
            </div>
            <div className="relative">
              <button className="relative text-[#8C8C8C]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v-.343C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-[#F7F4EF]"></span>
              </button>
            </div>
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-[#E8E0D6]"
            />
          </div>
        </header>

        {/* Greeting */}
        <div className="px-4 flex items-center gap-2 mt-6 mb-4">
          <svg className="w-4 h-4 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h2 className="text-sm font-semibold tracking-wider uppercase">Good morning, Matt</h2>
        </div>

        {/* Vertical timeline */}
        <div className="relative px-4 pb-24">
          <div className="absolute left-3 top-0 bottom-0 w-[1px] bg-[#E8E0D6]" />
          <div className="space-y-6 pt-4">
            {/* Card 1: Verse of the Day */}
            <div className="relative">
              <div className="absolute left-2 top-8 w-3 h-3 rounded-full border-2 border-[#0EA5E9] bg-[#0EA5E9]" />
              <div className="relative h-[320px] rounded-[24px] overflow-hidden shadow-lg shadow-black/10">
                <img
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=640&fit=crop"
                  alt="Beach at dusk"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 pb-10">
                  <p className="text-[10px] uppercase tracking-widest text-[#EF4444] font-medium mb-1">
                    Verse of the Day
                  </p>
                  <p className="text-xs font-bold text-white mb-4">1 John 4:11</p>
                  <p className="text-[20px] font-serif text-white leading-tight italic">
                    "Dear friends, since God so loved us, we also ought to love one another."
                  </p>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div className="flex items-center gap-1 text-white text-xs font-medium">
                    <svg className="w-3 h-3 fill-[#EF4444]" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span>77.8k</span>
                  </div>
                  <div className="flex items-center gap-1 text-white text-xs font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>48.8k</span>
                  </div>
                  <button className="text-white/80 text-xs">
                    <span className="mr-2">More</span>
                    <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 8l4 4m4-4-4 4M4 12h4m4 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Guided Scripture */}
            <div className="relative">
              <div className="absolute left-2 top-8 w-3 h-3 rounded-full border-2 border-[#C9C9C9]" />
              <div className="bg-white rounded-[20px] p-5 shadow-lg shadow-black/5 flex gap-4 items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-[#8C8C8C] font-medium mb-2">
                    Guided Scripture
                  </p>
                  <h3 className="text-lg font-bold leading-tight mb-3">
                    Cultivate a rhythm of Guided Scripture.
                  </h3>
                  <div className="flex items-center gap-1 text-[#8C8C8C] text-xs mb-3">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>2–5 min</span>
                  </div>
                </div>
                <div className="relative w-24 h-24 rounded-[16px] overflow-hidden shadow-lg shadow-black/10 flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1272e8e0cd?w=200&h=200&fit=crop&crop=face"
                    alt="Pastor"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md shadow-black/10">
                    <svg className="w-4 h-4 text-[#EF4444]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Guided Prayer (partially visible) */}
            <div className="relative">
              <div className="absolute left-2 top-8 w-3 h-3 rounded-full border-2 border-[#C9C9C9]" />
              <div className="bg-white rounded-[20px] p-5 shadow-lg shadow-black/5 flex gap-4 items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-[#8C8C8C] font-medium mb-2">
                    Guided Prayer
                  </p>
                  <h3 className="text-lg font-bold leading-tight mb-3">
                    Enter into a conversation with…
                  </h3>
                </div>
                <div className="relative w-24 h-24 rounded-[16px] overflow-hidden shadow-lg shadow-black/10 flex-shrink-0">
                  <div className="w-full h-full bg-[#0EA5E9]/20 rounded-[16px] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#0EA5E9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-0 h-8 rounded-full bg-[#F7F4EF] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[390px] h-20 bg-white border-t border-[#E8E0D6] shadow-lg shadow-black/5 flex items-center justify-around px-2 z-50">
        <button className="flex flex-col items-center gap-1 text-[#1A1A1A]">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#8C8C8C]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a4 4 0 004 4h12a4 4 0 004-4m0 0V9a4 4 0 00-4-4h-2a2 2 0 00-2 2 2 2 0 00-2 2m0 6h-12a2 2 0 01-2-2v-2a2 2 0 012-2h2a2 2 0 012 2m0 0V7a2 2 0 012-2h2.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[10px] font-medium">Bible</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#8C8C8C]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <span className="text-[10px] font-medium">Plans</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#8C8C8C]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-[10px] font-medium">Discover</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#8C8C8C]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.5 0 .5 0 .75.25M7 3v5c0 .5 0 .5.25.75M7 13q0-.264.25-.5M17 13q0 .132.25.5M12 17q-.132 0-.25-.5M16.5 7.5c-.217.217-.33.51-.33.75v2.25c0 .689.561 1.25 1.25 1.25H18c.24 0 .47-.042.68-.157m-3.84-.51a1.75 1.75 0 01-.68-1.5V4.25c0-.689.561-1.25 1.25-1.25h2.25c.24 0 .47.042.68.157m-7.67 11.25c-.217.217-.33.51-.33.75v2.25c0 .689.561 1.25 1.25 1.25h2.25c.24 0 .47-.042.68-.157m-3.84-.51a1.75 1.75 0 01-.68-1.5V17.25c0-.689.561-1.25 1.25-1.25h2.25c.24 0 .47-.042.68-.157" />
          </svg>
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </div>
  );
}
