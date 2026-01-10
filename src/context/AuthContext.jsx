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

  const loginWithPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const registerWithPassword = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    return data;
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
    // 1. CRUCIAL! Notify React immediately to change the screen
    setUser(null);
    setLoading(false);

    // 2. Clear browser garbage
    localStorage.clear();
    localStorage.removeItem("sb-agcjuoczilcpdthavaoo-auth-token"); // Ensure specific deletion

    // 3. Notify Supabase (if it fails, it doesn't matter because we've already visually logged you out)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión en servidor:", error);
    }
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
