import Link from "next/link"
import { useRouter } from "next/router"
import { logout } from "../lib/api"

export default function Navbar({ user }) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            Study Buddy
          </Link>
          
          <div className="flex items-center gap-6">
            <Link href="/requests" className="hover:text-primary-600">
              Requests
            </Link>
            
            {user ? (
              <>
                <span className="text-gray-600">
                  {user.name}
                  {user.roles && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({user.roles.join(", ")})
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-primary-600">
                  Login
                </Link>
                <Link href="/register" className="btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
