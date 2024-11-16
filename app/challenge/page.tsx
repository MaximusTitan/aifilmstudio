import React from "react";
import Link from "next/link";

export default function ChallengePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-rose-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-orange-500 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full blur-xl opacity-20" />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-orange-300 rounded-full blur-xl opacity-20" />
        </div>
        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 relative">
          <div className="animate-bounce mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-white rounded-full p-3">
              <div className="w-full h-full bg-rose-400 rounded-full flex items-center justify-center">
                <span className="text-xl sm:text-2xl">🌟</span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-center mb-4 sm:mb-6">
            AI Video Creation
            <span className="block text-yellow-300 transform -rotate-2 text-4xl sm:text-5xl md:text-7xl lg:text-8xl mt-2">
              CHALLENGE!
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-center mb-6 sm:mb-8">
            Create awesome videos with AI and win $100! 🎮 🎨 🎬
          </p>
          <div className="flex justify-center">
            <Link
              href="https://ischoolofai.com/tgais-wats"
              className="bg-yellow-400 text-rose-500 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-lg sm:text-xl hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg inline-flex items-center gap-2"
            >
              <span>🎯</span>
              <span>Join the Challenge!</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Fun Facts Cards */}
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:rotate-2 transition-transform">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🎨</div>
            <h3 className="font-bold text-rose-500 mb-2 text-lg sm:text-xl">
              Theme
            </h3>
            <p className="text-gray-700">Rural Education in India with AI</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:-rotate-2 transition-transform">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">👾</div>
            <h3 className="font-bold text-rose-500 mb-2 text-lg sm:text-xl">
              Who Can Join?
            </h3>
            <p className="text-gray-700">3rd Grade to 10th Grade Creators</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:rotate-2 transition-transform">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⏰</div>
            <h3 className="font-bold text-rose-500 mb-2 text-lg sm:text-xl">
              Video Length
            </h3>
            <p className="text-gray-700">30 Seconds of Awesome!</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:-rotate-2 transition-transform">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🎮</div>
            <h3 className="font-bold text-rose-500 mb-2 text-lg sm:text-xl">
              Cool Tool
            </h3>
            <p className="text-gray-700">
              AI Film Studio (25 Free Video Credits!)
            </p>
          </div>
        </div>

        {/* Important Dates */}
        <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 my-8 sm:my-12 md:my-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8">
            <span className="text-6xl sm:text-8xl">🏆</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-rose-500 mb-6 sm:mb-8">
            Mark Your Calendar! 📅
          </h2>
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center bg-orange-50 p-4 rounded-xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-400 rounded-full flex items-center justify-center text-xl sm:text-2xl">
                📝
              </div>
              <div className="ml-4">
                <p className="text-base">Last Day to Enter</p>
                <p className="font-bold text-neutral-800">November 24, 2024</p>
              </div>
            </div>
            <div className="flex items-center bg-orange-50 p-4 rounded-xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-400 rounded-full flex items-center justify-center text-xl sm:text-2xl">
                🎉
              </div>
              <div className="ml-4">
                <p className="text-base">Winner Announcement</p>
                <p className="font-bold text-neutral-800">November 24, 2024</p>
              </div>
            </div>
            <div className="flex items-center bg-orange-50 p-4 rounded-xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-400 rounded-full flex items-center justify-center text-xl sm:text-2xl">
                💰
              </div>
              <div className="ml-4">
                <p className="text-base">Prize Money</p>
                <p className="font-bold text-neutral-800">$100 Cash Prize!</p>
              </div>
            </div>
          </div>
        </div>

        {/* How to Join */}
        <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-rose-500 mb-6 sm:mb-8 text-center">
            🚀 Your Adventure Map 🗺️
          </h2>
          <div className="space-y-6 sm:space-y-8">
            {[...Array(13)].map((_, i) => (
              <div key={i} className="flex group">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-rose-400 text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-xl group-hover:scale-110 transition-transform">
                  {i + 1}
                </div>
                <div className="ml-4 bg-orange-50 p-4 rounded-xl flex-grow group-hover:-rotate-1 transition-transform">
                  {i === 0 && (
                    <p className="text-base sm:text-lg">
                      📖 Click on "Story" at the top
                    </p>
                  )}
                  {i === 1 && (
                    <p className="text-base sm:text-lg">
                      ✨ Write your amazing story and click "Generate"
                    </p>
                  )}
                  {i === 2 && (
                    <p className="text-base sm:text-lg">
                      📝 Make your story perfect and create the screenplay
                    </p>
                  )}
                  {i === 3 && (
                    <p className="text-base sm:text-lg">
                      🎬 Review the screenplay and make image prompts
                    </p>
                  )}
                  {i === 4 && (
                    <p className="text-base sm:text-lg">
                      🎨 Create your magical images
                    </p>
                  )}
                  {i === 5 && (
                    <p className="text-base sm:text-lg">
                      🎥 Turn your images into videos
                    </p>
                  )}
                  {i === 6 && (
                    <p className="text-base sm:text-lg">
                      💾 Save your awesome videos
                    </p>
                  )}
                  {i === 7 && (
                    <p className="text-base sm:text-lg">
                      🎵 Go to{" "}
                      <Link
                        href="https://clipchamp.com"
                        className="text-rose-500 hover:underline"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Clipchamp
                      </Link>{" "}
                      to add music and effects
                    </p>
                  )}
                  {i === 8 && (
                    <div className="text-base sm:text-lg">
                      <p>📱 Share your video everywhere!</p>
                      <div className="flex flex-wrap gap-2 sm:gap-4 mt-2">
                        <span className="bg-rose-100 px-3 py-1 rounded-full text-sm sm:text-base">
                          YouTube
                        </span>
                        <span className="bg-rose-100 px-3 py-1 rounded-full text-sm sm:text-base">
                          Instagram
                        </span>
                        <span className="bg-rose-100 px-3 py-1 rounded-full text-sm sm:text-base">
                          Facebook
                        </span>
                      </div>
                    </div>
                  )}
                  {i === 9 && (
                    <p className="text-base sm:text-lg">
                      📮 Submit your entry at{" "}
                      <Link
                        href="https://ischoolofai.com/tgais-wats"
                        className="text-rose-500 hover:underline"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        iSchool of AI
                      </Link>
                    </p>
                  )}
                  {i === 10 && (
                    <p className="text-base sm:text-lg">
                      🎓 Join a demo of{" "}
                      <Link
                        href="https://www.ischoolofai.com/the-genai-master"
                        className="text-rose-500 hover:underline"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        The GenAI Master Course
                      </Link>
                    </p>
                  )}
                  {i === 11 && (
                    <p className="text-base sm:text-lg">
                      👀 Our team will pick the winner
                    </p>
                  )}
                  {i === 12 && (
                    <p className="text-base sm:text-lg">
                      🎁 Winner gets the $100 prize!
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
