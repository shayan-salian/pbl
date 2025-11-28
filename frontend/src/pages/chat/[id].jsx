import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import ChatBox from "../../components/ChatBox";
import VideoCall from "../../components/VideoCall";
import { getRequest, getCurrentUser } from "../../lib/api";

export default function ChatPage() {
  const router = useRouter();
  const { id } = router.query;
  const [request, setRequest] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showVideo, setShowVideo] = useState(true); // show video panel by default

  useEffect(() => {
    if (id) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      const [userData, requestData] = await Promise.all([
        getCurrentUser(),
        getRequest(id),
      ]);

      setUser(userData);
      setRequest(requestData);
    } catch (err) {
      setError(err.message || "Failed to load chat");
      if (err.message.includes("authorized")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-500">Loading…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-4">
        <div className="card mb-2">
          <h1 className="text-xl md:text-2xl font-semibold mb-2 text-slate-50">
            {request.subject} • {request.topic}
          </h1>
          <div className="text-xs md:text-sm text-slate-300 space-y-1">
            <p>Student: {request.studentId?.name || "Unknown"}</p>
            <p>Tutor: {request.tutorId?.name || "Not assigned yet"}</p>
            <p>
              Status:{" "}
              <span className="capitalize text-primary-300">
                {request.status}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-slate-200">
            Live session
          </h2>
          <button
            onClick={() => setShowVideo((prev) => !prev)}
            className="btn-secondary text-[11px] px-3 py-1"
          >
            {showVideo ? "Hide video call" : "Show video call"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Left: Video (optional) */}
          {showVideo && (
            <div className="order-1 md:order-none">
              <VideoCall requestId={id} user={user} />
            </div>
          )}

          {/* Right: Chat */}
          <div className={showVideo ? "" : "md:col-span-2"}>
            <ChatBox requestId={id} user={user} />
          </div>
        </div>
      </main>
    </div>
  );
}

