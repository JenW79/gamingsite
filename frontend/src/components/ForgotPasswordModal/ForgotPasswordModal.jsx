// components/ForgotPasswordModal/ForgotPasswordModal.jsx
import { useState } from "react";
import LoginFormModal from "../LoginFormModal/LoginFormModal";
import { useModal} from "../../context/Modal";
import "./ForgotPasswordModal.css";

export default function ForgotPasswordModal() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const { setModalContent } = useModal();
  const { closeModal } = useModal();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/users/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setStatus("✅ Check your email for a reset link.");
    } else {
      setStatus("❌ Error sending reset link.");
    }
  };

  return (
    <div className="forgot-password-modal">
      <h2>Forgot Password?</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send Reset Link</button>
      </form>
      {status && <p>{status}</p>}
      <p
        className="back-to-login-link"
        onClick={() => {
          closeModal();
          setTimeout(() => setModalContent(<LoginFormModal />), 250);
        }}
      >
        ← Back to Login
      </p>
    </div>
  );
}
