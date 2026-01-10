import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const { loginWithOAuth, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  // Redirección si ya está logueado
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") navigate("/admin/dashboard");
      else navigate("/user/catalog");
    }
  }, [isAuthenticated, user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setError("");
      await loginWithOAuth("google");
    } catch (err) {
      setError("No se pudo conectar con Google.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {/* Tarjeta Principal */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Encabezado Azul UCE */}
        <div className="bg-primary p-8 text-center">
          <div className="bg-white/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Sistema Bibliotecario
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Universidad Central del Ecuador
          </p>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-accent text-sm rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-gray-500 text-center text-sm mb-6">
              Inicia sesión con tu cuenta institucional
            </p>

            {/* Botón de Google arreglado */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-medium py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow transition-all duration-200"
            >
              {/* AQUÍ ESTÁ EL ARREGLO: w-6 h-6 limita el tamaño */}
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-6 h-6"
              />
              <span>Continuar con Google</span>
            </button>
          </div>

          <div className="mt-8 text-center border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Facultad de Ingeniería
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
