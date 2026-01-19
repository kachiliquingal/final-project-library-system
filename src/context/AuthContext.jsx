import { useAuthStore } from "../store/authStore";

// HOOK ADAPTER
export const useAuth = () => {
  const store = useAuthStore();

  return {
    user: store.user,
    loading: store.loading,
    isAuthenticated: store.isAuthenticated,
    isAdmin: store.isAdmin,
    loginWithPassword: store.loginWithPassword,
    registerWithPassword: store.registerWithPassword,
    loginWithOAuth: store.loginWithOAuth,
    logout: store.logout,
  };
};

// PROVIDER WITH LOADING SCREEN
export const AuthProvider = ({ children }) => {
  // We read the loading state directly from the store
  const loading = useAuthStore((state) => state.loading);

  // If loading, we show the spinner instead of the app
  // This prevents protected routes from redirecting prematurely
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600 font-medium">Cargando sistema...</p>
      </div>
    );
  }

  return <>{children}</>;
};
