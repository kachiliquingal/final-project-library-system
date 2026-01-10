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
        // Temporizador de seguridad por si Supabase tarda mucho
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 2000)
        );
        const sessionPromise = supabase.auth.getSession();

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
        console.warn("Limpiando sesión inestable...", error);
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

  // --- NUEVAS FUNCIONES ---

  // 1. Login con Correo y Contraseña
  const loginWithPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  // 2. Registro de Usuario Nuevo (Con Full Name para el trigger)
  const registerWithPassword = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName, // IMPORTANTE: Esto activa tu trigger en la DB
        },
      },
    });
    if (error) throw error;
    return data;
  };

  // 3. Login Social (Google / Github)
  const loginWithOAuth = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    localStorage.clear();
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loginWithOAuth,
    loginWithPassword,
    registerWithPassword,
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
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando sistema...</p>
        </div>
      )}
    </AuthContext.Provider>
  );
};
