import Image from "next/image";
import Link from "next/link";

export default function ChallengePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-rose-500 to-rose-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-6">
            GenAI Creator Competition
          </h1>
          <p className="text-xl text-center mb-8">
            Empowering young minds to explore the magic of GenAI
          </p>
          <div className="flex justify-center">
            <Link
              href="https://ischoolofai.com/tgais-wats"
              className="bg-white text-rose-500 px-8 py-3 rounded-full font-semibold hover:bg-rose-50 transition-colors"
            >
              Submit Your Entry
            </Link>
          </div>
        </div>
      </div>

      {/* Competition Details */}
      <div className="container mx-auto px-4 py-16">
        <div className=" mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              The Competition
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                We at iSchool of AI are conducting a GenAI Creator Competition
                to encourage school kids to experience the magic of GenAI hands
                on. iSchool of AI is the education division of {"{igebra.ai}"},
                an AI research, development and education company.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-rose-50 p-6 rounded-lg">
                  <h3 className="font-bold text-rose-500 mb-2">Theme</h3>
                  <p>Rural Education in India with AI</p>
                </div>
                <div className="bg-rose-50 p-6 rounded-lg">
                  <h3 className="font-bold text-rose-500 mb-2">Eligibility</h3>
                  <p>3rd Grade to 10th Grade Kids</p>
                </div>
                <div className="bg-rose-50 p-6 rounded-lg">
                  <h3 className="font-bold text-rose-500 mb-2">Duration</h3>
                  <p>Maximum 30 Seconds</p>
                </div>
                <div className="bg-rose-50 p-6 rounded-lg">
                  <h3 className="font-bold text-rose-500 mb-2">Tool</h3>
                  <p>Clipsa (With 15 Free Video Credits)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Important Dates
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                <div className="ml-4">
                  <p className="font-semibold">Last Date for Submission</p>
                  <p className="text-gray-600">24 November 24</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                <div className="ml-4">
                  <p className="font-semibold">Winner Announcement</p>
                  <p className="text-gray-600">24 November 24</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                <div className="ml-4">
                  <p className="font-semibold">Prize for Winner</p>
                  <p className="text-gray-600">$100</p>
                </div>
              </div>
            </div>
          </div>

          {/* Process Steps */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              The Process
            </h2>
            <div className="space-y-6">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  <div className="ml-4">
                    {i === 0 && (
                      <p>
                        Go to the website{" "}
                        <Link
                          href="https://app.aifilmstudio.co"
                          className="text-rose-500 hover:underline"
                        >
                          https://app.aifilmstudio.co
                        </Link>{" "}
                        (or) Scan the QR code
                      </p>
                    )}
                    {i === 1 && <p>Sign-up and confirm email address</p>}
                    {i === 2 && <p>Click on "Story" tab on the top</p>}
                    {i === 3 && (
                      <p>
                        Enter the story prompt. Add as many details as possible
                        and click on "Generate Story"
                      </p>
                    )}
                    {i === 4 && (
                      <p>
                        Review the generated story, edit if required and click
                        on "Generate Screenplay"
                      </p>
                    )}
                    {i === 5 && (
                      <p>
                        Review the generated screenplay, edit if required and
                        click on "Generate Image Prompts"
                      </p>
                    )}
                    {i === 6 && (
                      <p>
                        Review the generated image prompts, edit if required and
                        click on "Generate Images"
                      </p>
                    )}
                    {i === 7 && (
                      <p>
                        Review generated images and click on generate videos
                      </p>
                    )}
                    {i === 8 && <p>Download the videos</p>}
                    {i === 9 && (
                      <p>
                        Go to the website{" "}
                        <Link
                          href="https://clipchamp.com"
                          className="text-rose-500 hover:underline"
                        >
                          https://clipchamp.com
                        </Link>
                        , import clips, add background music, titles effects and
                        export the video
                      </p>
                    )}
                    {i === 10 && (
                      <div>
                        <p>Post your video across all possible channels</p>
                        <ul className="list-disc ml-6 mt-2">
                          <li>Youtube</li>
                          <li>Instagram</li>
                          <li>Facebook</li>
                          <li>Any Other Channel</li>
                        </ul>
                      </div>
                    )}
                    {i === 11 && (
                      <p>
                        Go to this page{" "}
                        <Link
                          href="https://ischoolofai.com/tgais-wats"
                          className="text-rose-500 hover:underline"
                        >
                          https://ischoolofai.com/tgais-wats
                        </Link>
                        , and submit your entry with your details and video
                        concept explanation
                      </p>
                    )}
                    {i === 12 && (
                      <p>
                        Sign-up for a group demo for The GenAI Master Course to
                        learn more about GenAI
                      </p>
                    )}
                    {i === 13 && (
                      <p>
                        Our team will review the data and announce the winner
                      </p>
                    )}
                    {i === 14 && <p>Winner will receive the cash prize</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
