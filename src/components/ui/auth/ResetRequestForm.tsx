import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestResetPassword } from "@/services/AuthService";
import { useNavigate } from "react-router-dom";

export const ResetRequestForm = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!validateEmail(email)) {
      setMessage("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      await requestResetPassword(email);
      localStorage.setItem("resetEmail", email);
      setMessage("Verification code sent to your email.");
      setTimeout(() => {
        navigate("/new-password");
      }, 100); 
    } catch (error) {
      setMessage("Failed to send reset email. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-200 to-blue-400">
      <form onSubmit={handleSubmit} className="bg-white p-16 rounded-lg shadow-lg w-full max-w-3xl min-h-[600px] space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
        <p className="text-gray-600 text-left">Enter your email to reset your password</p>

        <Input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        {message && <p className="text-sm text-green-600">{message}</p>}

        <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:bg-gradient-to-l" disabled={loading}>
          {loading ? "Loading..." : "Submit"}
        </Button>

        <p className="text-sm text-gray-500">
          Already have an account? <a href="/login" className="text-blue-600">Log in</a>
        </p>
      </form>
    </div>
  );
};