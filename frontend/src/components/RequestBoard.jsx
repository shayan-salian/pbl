import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { getRequests, acceptRequest } from "../lib/api";

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

export default function RequestBoard({ user }) {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({ subject: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [filters.subject, filters.status]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getRequests(filters);
      setRequests(data.items || []);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    if (!user?.roles?.includes("tutor")) {
      alert("Only tutors can accept requests");
      return;
    }

    setActionLoading(requestId);
    try {
      const result = await acceptRequest(requestId);
      if (result.chatRoomId) {
        router.push(`/chat/${requestId}`);
      } else {
        loadRequests();
      }
    } catch (err) {
      alert(err.message || "Failed to accept request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewChat = (requestId) => {
    router.push(`/chat/${requestId}`);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "open":
        return "status-pill-open";
      case "accepted":
      case "in-progress":
        return "status-pill-accepted";
      case "completed":
        return "status-pill-completed";
      case "cancelled":
        return "status-pill-cancelled";
      default:
        return "pill";
    }
  };

  if (loading) {
    return (
      <div className="card flex items-center justify-center text-sm text-slate-400">
        Loading requests…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={filters.subject}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder="Eg. Mathematics"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="input-field"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="accepted">Accepted</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests */}
      {requests.length === 0 ? (
        <div className="card text-center text-sm text-slate-400">
          No requests found. Try changing filters or create a new request.
        </div>
      ) : (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2"
        >
          {requests.map((request) => {
            const isOwner = user?._id === request.studentId?._id;
            const isTutor = user?._id === request.tutorId?._id;
            const canAccept =
              user?.roles?.includes("tutor") &&
              request.status === "open" &&
              !isOwner;
            const canViewChat =
              (isOwner || isTutor) && request.status !== "open";

            return (
              <motion.div
                key={request._id}
                variants={cardVariants}
                className="card flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      {request.subject} • {request.topic}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Posted by {request.studentId?.name || "Unknown"}
                    </p>
                  </div>
                  <span className={`${getStatusClass(request.status)} text-[10px]`}>
                    {request.status}
                  </span>
                </div>

                {request.description && (
                  <p className="text-xs text-slate-300">
                    {request.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                  {request.availability && (
                    <span>📅 {request.availability}</span>
                  )}
                  {request.budget > 0 && (
                    <span>💰 ₹{request.budget}</span>
                  )}
                  {request.tutorId && (
                    <span>👨‍🏫 Tutor: {request.tutorId.name}</span>
                  )}
                </div>

                <div className="mt-2 flex gap-2">
                  {canAccept && (
                    <button
                      onClick={() => handleAccept(request._id)}
                      disabled={actionLoading === request._id}
                      className="btn-primary text-xs"
                    >
                      {actionLoading === request._id
                        ? "Accepting..."
                        : "Accept request"}
                    </button>
                  )}
                  {canViewChat && (
                    <button
                      onClick={() => handleViewChat(request._id)}
                      className="btn-secondary text-xs"
                    >
                      Open chat
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
