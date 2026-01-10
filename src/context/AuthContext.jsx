import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../api/supabaseClient";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // --- TEMPORIZADOR DE SEGURIDAD ---
        // Si Supabase no responde en 2 segundos, forzamos el error para limpiar
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Tiempo de espera agotado")), 2000)
        );

        const sessionPromise = supabase.auth.getSession();

        // Corremos una carrera: ¿Quién gana? ¿La sesión o el temporizador?
        const {
          data: { session },
          error,
        } = await Promise.race([sessionPromise, timeoutPromise]);

        if (error) throw error;

        if (session && mounted) {
          await fetchProfile(session.user);
        } else if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.warn(
          "⚠️ Detectado bloqueo de sesión. Ejecutando limpieza automática...",
          error
        );
        // AQUÍ ESTÁ LA SOLUCIÓN AL "MALDITO ERROR":
        localStorage.clear();
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
        localStorage.clear();
      } else if (session) {
        await fetchProfile(session.user);
      } else if (!session) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (authUser) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      setUser({
        id: authUser.id,
        email: authUser.email,
        role: data?.role || "user",
        name: data?.full_name || authUser.email,
      });
    } catch (error) {
      // Fallback seguro
      setUser({
        id: authUser.id,
        email: authUser.email,
        role: "user",
        name: authUser.email,
      });
    } finally {
      setLoading(false);
    }
  };

  const loginWithOAuth = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    localStorage.clear(); // Limpiamos primero por si acaso
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loginWithOAuth,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? (
        children
      ) : (
        // Si tarda más de 3 segundos visualmente, mostramos botón de pánico
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando sistema...</p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="mt-4 text-xs text-red-500 underline hover:text-red-700 cursor-pointer"
          >
            ¿Se quedó pegado? Clic aquí para reiniciar
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
};
