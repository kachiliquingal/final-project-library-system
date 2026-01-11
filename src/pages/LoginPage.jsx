import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, User, Github, Book } from "lucide-react";

export default function LoginPage() {
  const {
    loginWithOAuth,
    loginWithPassword,
    registerWithPassword,
    isAuthenticated,
    user,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // 1. EFECTO DE REDIRECCIÓN (Si ya estás logueado legalmente)
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") navigate("/admin/dashboard");
      else navigate("/user/catalog");
    }
  }, [isAuthenticated, user, navigate]);

  // 2. NUEVO: AUTO-LIMPIEZA DE TOKENS ZOMBIES (El Blindaje)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const hasZombieToken = Object.keys(localStorage).some((key) =>
        key.startsWith("sb-")
      );

      if (hasZombieToken) {
        console.warn(
          "🛡️ Sistema: Detectada sesión corrupta antigua. Ejecutando auto-limpieza..."
        );
        localStorage.clear();
      }
    }
  }, [authLoading, isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN ---
        const { user: loggedUser, error: loginError } = await loginWithPassword(
          email,
          password
        );
        if (loginError) throw loginError;

        if (loggedUser) {
          navigate("/admin/dashboard");
        }
      } else {
        // --- REGISTRO ---
        if (!fullName) throw new Error("El nombre es requerido");

        // Doble seguridad: Asegurar limpieza antes de registrar
        if (!isAuthenticated) localStorage.clear();

        const { user, error: registerError } = await registerWithPassword(
          email,
          password,
          fullName
        );

        if (registerError) throw registerError;

        if (user) {
          setMsg("Cuenta creada con éxito. Ya puedes iniciar sesión.");
          setIsLogin(true);
          setEmail("");
          setPassword("");
          setFullName("");
        }
      }
    } catch (err) {
      console.error(err);
      if (err.message.includes("User already registered")) {
        setError("Este correo ya está registrado. Intenta iniciar sesión.");
      } else {
        setError(err.message || "Error de conexión. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
      setError("");
      await loginWithOAuth(provider);
    } catch (err) {
      setError(`Error conectando con ${provider}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header Azul */}
        <div className="bg-primary p-6 text-center">
          <div className="bg-white/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            {/* Usamos el icono Book nativo de lucide-react */}
            <Book className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">
            Sistema Bibliotecario
          </h1>
          <p className="text-blue-100 text-xs mt-1">
            Universidad Central del Ecuador
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setIsLogin(true);
              setError("");
              setMsg("");
            }}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${
              isLogin
                ? "text-primary border-b-2 border-primary"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            INGRESAR
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError("");
              setMsg("");
            }}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${
              !isLogin
                ? "text-primary border-b-2 border-primary"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            CREAR CUENTA
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100 text-center animate-pulse">
              {error}
            </div>
          )}
          {msg && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 text-xs rounded border border-green-100 text-center">
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nombre Completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Correo Institucional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 text-sm mt-2 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Procesando...</span>
                </>
              ) : isLogin ? (
                "INICIAR SESIÓN"
              ) : (
                "REGISTRARSE"
              )}
            </button>
          </form>

          <div className="relative mt-8 mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-400 uppercase tracking-wider">
                O continúa con
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleOAuth("github")}
              className="flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 px-4 rounded-lg hover:bg-black transition-all text-sm font-medium"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </button>

            <button
              onClick={() => handleOAuth("google")}
              className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="G"
                className="w-4 h-4"
              />
              <span>Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
