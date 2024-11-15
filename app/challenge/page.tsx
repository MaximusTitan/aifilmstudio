import React from "react";
import Link from "next/link";

export default function ChallengePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-rose-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-red-600 to-red-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] opacity-10 bg-center bg-cover" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="animate-bounce mb-4">
            <div className="w-16 h-16 mx-auto bg-white rounded-full p-3">
              <div className="w-full h-full bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🌟</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-7xl font-bold text-center mb-6 font-gaming">
            AI Video Creation
            <span className="block text-yellow-300 transform -rotate-2 text-5xl md:text-8xl mt-2">
              CHALLENGE!
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-center mb-8 font-comic">
            Create awesome videos with AI and win $100! 🎮 🎨 🎬
          </p>
          <div className="flex justify-center">
            <Link
              href="https://ischoolofai.com/tgais-wats"
              className="bg-yellow-400 text-red-600 px-8 py-4 rounded-full font-bold text-xl hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg"
            >
              🎯 Join the Challenge!
            </Link>
          </div>
        </div>
      </div>

      {/* Fun Facts Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:rotate-2 transition-transform">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="font-bold text-red-500 mb-2 text-xl">Theme</h3>
            <p className="text-gray-700">Rural Education in India with AI</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:-rotate-2 transition-transform">
            <div className="text-4xl mb-4">👾</div>
            <h3 className="font-bold text-red-500 mb-2 text-xl">
              Who Can Join?
            </h3>
            <p className="text-gray-700">3rd Grade to 10th Grade Creators</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:rotate-2 transition-transform">
            <div className="text-4xl mb-4">⏰</div>
            <h3 className="font-bold text-red-500 mb-2 text-xl">
              Video Length
            </h3>
            <p className="text-gray-700">30 Seconds of Awesome!</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:-rotate-2 transition-transform">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="font-bold text-red-500 mb-2 text-xl">Cool Tool</h3>
            <p className="text-gray-700">Clipsa (15 Free Videos!)</p>
          </div>
        </div>

        {/* Important Dates */}
        <div className="bg-white rounded-3xl shadow-lg p-8 my-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8">
            <span className="text-8xl">🏆</span>
          </div>
          <h2 className="text-4xl font-bold text-red-600 mb-8">
            Mark Your Calendar! 📅
          </h2>
          <div className="space-y-6">
            <div className="flex items-center bg-orange-50 p-4 rounded-xl">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-2xl">
                📝
              </div>
              <div className="ml-4">
                <p className="font-bold text-xl">Last Day to Enter</p>
                <p className="text-gray-600">November 24, 2024</p>
              </div>
            </div>
            <div className="flex items-center bg-orange-50 p-4 rounded-xl">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-2xl">
                🎉
              </div>
              <div className="ml-4">
                <p className="font-bold text-xl">Winner Announcement</p>
                <p className="text-gray-600">November 24, 2024</p>
              </div>
            </div>
            <div className="flex items-center bg-orange-50 p-4 rounded-xl">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-2xl">
                💰
              </div>
              <div className="ml-4">
                <p className="font-bold text-xl">Prize Money</p>
                <p className="text-gray-600">$100 Cash Prize!</p>
              </div>
            </div>
          </div>
        </div>

        {/* How to Join */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-4xl font-bold text-red-600 mb-8 text-center">
            🚀 Your Adventure Map 🗺️
          </h2>
          <div className="space-y-8">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="flex group">
                <div className="flex-shrink-0 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                  {i + 1}
                </div>
                <div className="ml-4 bg-orange-50 p-4 rounded-xl flex-grow group-hover:-rotate-1 transition-transform">
                  {i === 0 && (
                    <p className="text-lg">
                      🌐 Visit{" "}
                      <Link
                        href="https://app.aifilmstudio.co"
                        className="text-red-500 hover:underline"
                      >
                        AI Film Studio
                      </Link>{" "}
                      or scan the QR code
                    </p>
                  )}
                  {i === 1 && (
                    <p className="text-lg">✉️ Sign-up and confirm your email</p>
                  )}
                  {i === 2 && (
                    <p className="text-lg">📖 Click on "Story" at the top</p>
                  )}
                  {i === 3 && (
                    <p className="text-lg">
                      ✨ Write your amazing story and click "Generate"
                    </p>
                  )}
                  {i === 4 && (
                    <p className="text-lg">
                      📝 Make your story perfect and create the screenplay
                    </p>
                  )}
                  {i === 5 && (
                    <p className="text-lg">
                      🎬 Review the screenplay and make image prompts
                    </p>
                  )}
                  {i === 6 && (
                    <p className="text-lg">🎨 Create your magical images</p>
                  )}
                  {i === 7 && (
                    <p className="text-lg">🎥 Turn your images into videos</p>
                  )}
                  {i === 8 && (
                    <p className="text-lg">💾 Save your awesome videos</p>
                  )}
                  {i === 9 && (
                    <p className="text-lg">
                      🎵 Go to{" "}
                      <Link
                        href="https://clipchamp.com"
                        className="text-red-500 hover:underline"
                      >
                        Clipchamp
                      </Link>{" "}
                      to add music and effects
                    </p>
                  )}
                  {i === 10 && (
                    <div className="text-lg">
                      <p>📱 Share your video everywhere!</p>
                      <div className="flex gap-4 mt-2">
                        <span className="bg-red-100 px-3 py-1 rounded-full">
                          YouTube
                        </span>
                        <span className="bg-red-100 px-3 py-1 rounded-full">
                          Instagram
                        </span>
                        <span className="bg-red-100 px-3 py-1 rounded-full">
                          Facebook
                        </span>
                      </div>
                    </div>
                  )}
                  {i === 11 && (
                    <p className="text-lg">
                      📮 Submit your entry at{" "}
                      <Link
                        href="https://ischoolofai.com/tgais-wats"
                        className="text-red-500 hover:underline"
                      >
                        iSchool of AI
                      </Link>
                    </p>
                  )}
                  {i === 12 && (
                    <p className="text-lg">
                      🎓 Join a demo of The GenAI Master Course
                    </p>
                  )}
                  {i === 13 && (
                    <p className="text-lg">👀 Our team will pick the winner</p>
                  )}
                  {i === 14 && (
                    <p className="text-lg">🎁 Winner gets the $100 prize!</p>
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
