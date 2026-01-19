import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "../api/supabaseClient";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // INITIAL STATE
      user: null,
      loading: true,
      isAuthenticated: false,
      isAdmin: false,

      // ACTIONS (Setters)
      setUser: (userData) => {
        set({
          user: userData,
          isAuthenticated: !!userData,
          isAdmin: userData?.role === "admin",
          loading: false,
        });
      },

      setLoading: (isLoading) => set({ loading: isLoading }),

      // BUSINESS LOGIC

      // --- Fetch Profile ---
      fetchProfile: async (sessionUser) => {
        if (!sessionUser) return null;

        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", sessionUser.id)
            .single();

          if (error && error.code !== "PGRST116") {
            console.error("Error fetching profile:", error);
          }

          const userData = {
            id: sessionUser.id,
            email: sessionUser.email,
            role: data?.role || "user",
            name: data?.full_name || sessionUser.email,
          };

          get().setUser(userData);
          return userData;
        } catch (error) {
          // Basic fallback
          const basicUser = {
            id: sessionUser.id,
            email: sessionUser.email,
            role: "user",
            name: sessionUser.email,
          };
          get().setUser(basicUser);
          return basicUser;
        }
      },

      // Auth Methods

      loginWithPassword: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        return data;
      },

      // Registration
      registerWithPassword: async (email, password, fullName) => {
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
      },

      // Social Login (Google, GitHub)
      loginWithOAuth: async (provider) => {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
        return data;
      },

      logout: async () => {
        set({ user: null, isAuthenticated: false, isAdmin: false });
        localStorage.clear();
        sessionStorage.removeItem("login_notified");
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error("Error al cerrar sesión:", error);
        }
      },

      // Global initializer
      initializeAuthListener: () => {
        set({ loading: true });

        // Initial check
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session) {
            await get().fetchProfile(session.user);
          } else {
            set({ loading: false, user: null });
          }
        });

        // Subscription to changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === "SIGNED_OUT") {
            set({
              user: null,
              isAuthenticated: false,
              isAdmin: false,
              loading: false,
            });
            localStorage.clear();
            sessionStorage.removeItem("login_notified");
          } else if (session) {
            const currentUser = get().user;
            // Only reload profile if different or doesn't exist
            if (!currentUser || currentUser.id !== session.user.id) {
              await get().fetchProfile(session.user);
            }

            // Login Notification
            const hasNotified = sessionStorage.getItem("login_notified");
            if (event === "SIGNED_IN" && !hasNotified) {
              await supabase.from("notifications").insert([
                {
                  type: "LOGIN",
                  message: `Inicio de sesión detectado: ${session.user.email}`,
                  user_id: session.user.id,
                },
              ]);
              sessionStorage.setItem("login_notified", "true");
            }
          }
        });

        return () => subscription.unsubscribe();
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    },
  ),
);
