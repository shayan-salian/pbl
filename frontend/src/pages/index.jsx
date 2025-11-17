import Navbar from "../components/Navbar"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Study Buddy
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect with expert tutors for personalized learning
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/requests" className="btn-primary text-lg px-6 py-3">
              Find a Tutor
            </Link>
            <Link href="/register" className="btn-secondary text-lg px-6 py-3">
              Get Started
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card text-center">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-xl font-semibold mb-2">Post Requests</h3>
            <p className="text-gray-600">
              Describe what you need help with and set your budget
            </p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-3">👨‍🏫</div>
            <h3 className="text-xl font-semibold mb-2">Get Matched</h3>
            <p className="text-gray-600">
              Expert tutors review and accept your requests
            </p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-xl font-semibold mb-2">Learn Live</h3>
            <p className="text-gray-600">
              Chat in real-time and complete your sessions
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-6">How It Works</h2>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </span>
              <div>
                <strong>Create an account</strong> as a student or tutor
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </span>
              <div>
                <strong>Post a help request</strong> with subject, topic, and budget
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </span>
              <div>
                <strong>Connect with a tutor</strong> who accepts your request
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                4
              </span>
              <div>
                <strong>Learn via chat</strong> and complete your session
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                5
              </span>
              <div>
                <strong>Rate and review</strong> your tutor
              </div>
            </li>
          </ol>
        </div>
      </main>
    </div>
  )
}
