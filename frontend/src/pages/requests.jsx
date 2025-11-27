import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import RequestBoard from "../components/RequestBoard";
import { createRequest, getCurrentUser } from "../lib/api";
import { motion } from "framer-motion";

export default function Requests() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    topic: "",
    description: "",
    availability: "",
    budget: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch {
      router.push("/login");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createRequest({
        ...formData,
        budget: parseFloat(formData.budget) || 0,
      });

      setFormData({
        subject: "",
        topic: "",
        description: "",
        availability: "",
        budget: "",
      });
      setShowForm(false);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      setError(err.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const canCreateRequest = user?.roles?.includes("student");

  return (
    <>
      <Navbar user={user} />

      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
              Help requests
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Post what you need help with or browse open requests to accept as
              a tutor.
            </p>
          </div>

          {canCreateRequest && (
            <button
              onClick={() => setShowForm((prev) => !prev)}
              className="btn-primary"
            >
              {showForm ? "Close form" : "New request"}
            </button>
          )}
        </header>

        {showForm && canCreateRequest && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="card"
          >
            <h2 className="text-lg font-semibold text-slate-100 mb-1.5">
              Create a new help request
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Be specific so the right tutor can understand your need quickly.
            </p>

            {error && (
              <div className="mb-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Subject *
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Eg. Mathematics, Physics"
                  />
                </div>
                <div>
                  <label
                    htmlFor="topic"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Topic *
                  </label>
                  <input
                    id="topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Eg. Calculus - Derivatives"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Brief description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Explain what you’re stuck on or what outcome you want."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                <div>
                  <label
                    htmlFor="availability"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Availability
                  </label>
                  <input
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Eg. Weekdays after 7 PM, Saturday mornings"
                  />
                </div>
                <div>
                  <label
                    htmlFor="budget"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Budget (₹)
                  </label>
                  <input
                    id="budget"
                    name="budget"
                    type="number"
                    min="0"
                    step="50"
                    value={formData.budget}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Eg. 500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Creating..." : "Create request"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <RequestBoard key={refreshKey} user={user} />
      </div>
    </>
  );
}
