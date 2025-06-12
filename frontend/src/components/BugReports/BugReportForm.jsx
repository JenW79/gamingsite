import { useState } from "react";
import "./BugReportForm.css";

export default function BugReportForm({ user }) {
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/bugreport", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.cookie
          .split("; ")
          .find((row) => row.startsWith("XSRF-TOKEN="))
          ?.split("=")[1],
      },
      body: JSON.stringify({ userId: user.id, description }),
    });

    if (res.ok) {
      setSubmitted(true);
    }
  };

  return (
    <div className="bug-report-form">
      <h2>Report a Bug 🐛</h2>
      {submitted ? (
        <p>Thank you! Your report has been submitted. ✅</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Describe the issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <button type="submit">Submit Report</button>
        </form>
      )}
    </div>
  );
}
