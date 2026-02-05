import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import WelcomeSection from "../components/auth/WelcomeSection";
import AuthForm from "../components/auth/AuthForm";

export default function LoginPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // REDIRECT EFFECT (Security)
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") navigate("/admin/dashboard");
      else navigate("/user/catalog");
    }
  }, [isAuthenticated, user, navigate]);

  // CLEANING UP CORRUPT SESSIONS
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const hasZombieToken = Object.keys(localStorage).some((key) =>
        key.startsWith("sb-"),
      );

      if (hasZombieToken) {
        console.warn("🛡️ Sistema: Limpiando sesión corrupta...");
        localStorage.clear();
      }
    }
  }, [authLoading, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24">
        <WelcomeSection />

        <AuthForm />
      </div>
    </div>
  );
}
