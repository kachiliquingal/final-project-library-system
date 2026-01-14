import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "../api/supabaseClient";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Referencia para evitar re-renderizados innecesarios en actualizaciones de sesión
  const userRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    // 1. Cargar perfil del usuario desde la base de datos
    const fetchProfile = async (sessionUser) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .single();

        // Ignoramos error PGRST116 (sin resultados) si es un usuario nuevo
        if (error && error.code !== 'PGRST116') {
            console.error("Error fetching profile:", error);
        }

        const userData = {
          id: sessionUser.id,
          email: sessionUser.email,
          role: data?.role || "user",
          name: data?.full_name || sessionUser.email,
        };

        if (mounted) {
          setUser(userData);
          userRef.current = userData;
        }
      } catch (error) {
        // Fallback seguro en caso de error crítico
        const basicUser = {
          id: sessionUser.id,
          email: sessionUser.email,
          role: "user",
          name: sessionUser.email,
        };
        if (mounted) {
            setUser(basicUser);
            userRef.current = basicUser;
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // 2. Verificación Inicial de Sesión
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session && mounted) {
          await fetchProfile(session.user);
        } else if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // 3. Escuchar cambios de estado (Login, Logout, Refresh Token, Cambio de Pestaña)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (event === "SIGNED_OUT") {
        setUser(null);
        userRef.current = null;
        setLoading(false);
        localStorage.clear();
      } 
      else if (session) {
        // OPTIMIZACIÓN CRÍTICA:
        // Si el usuario ya está cargado en memoria, evitamos recargar el perfil.
        // Esto previene congelamientos al cambiar de pestaña.
        if (userRef.current && userRef.current.id === session.user.id) {
             return; 
        }
        await fetchProfile(session.user);
      } 
      else if (!session) {
        setUser(null);
        userRef.current = null;
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- MÉTODOS DE AUTENTICACIÓN ---

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
    setUser(null);
    userRef.current = null;
    setLoading(false);
    localStorage.clear();
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
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