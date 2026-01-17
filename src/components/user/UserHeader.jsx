import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { LogOut, User, Book, Library, Bell, Clock, Info } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../../api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "../../hooks/useRealtime";

export default function UserHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  // 1. Cargar notificaciones
  const { data: notifications = [] } = useQuery({
    queryKey: ["user-notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 0,
  });

  // 2. Realtime
  useRealtime("notifications", (payload) => {
    // Si la nueva notificación es para mí, recargo
    if (payload.new?.user_id === user?.id) {
      queryClient.invalidateQueries({
        queryKey: ["user-notifications", user?.id],
      });
    }
  });

  // 3. Marcar como leídas
  const markAsRead = async () => {
    if (unreadCount > 0) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      queryClient.invalidateQueries({
        queryKey: ["user-notifications", user?.id],
      });
    }
  };

  const toggleNotif = () => {
    if (!isNotifOpen) markAsRead();
    setIsNotifOpen(!isNotifOpen);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("es-EC", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <header className="bg-white h-16 px-6 flex items-center justify-between shadow-sm sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Book className="w-5 h-5 text-white" />
          </div>
          <div className="hidden md:block">
            <h1 className="font-bold text-lg text-gray-800 leading-none">
              Biblioteca
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Facultad de Ingeniería
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/user/catalog"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive("/user/catalog")
                ? "bg-gray-100 text-primary"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Catálogo
          </Link>
          <Link
            to="/user/my-loans"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive("/user/my-loans")
                ? "bg-gray-100 text-primary"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Mis Préstamos
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex md:hidden gap-4 mr-2 border-r border-gray-200 pr-4">
          <Link
            to="/user/catalog"
            className={
              isActive("/user/catalog") ? "text-primary" : "text-gray-400"
            }
          >
            <Book className="w-5 h-5" />
          </Link>
          <Link
            to="/user/my-loans"
            className={
              isActive("/user/my-loans") ? "text-primary" : "text-gray-400"
            }
          >
            <Library className="w-5 h-5" />
          </Link>
        </div>

        {/* 🔔 CAMPANA */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={toggleNotif}
            className={`relative p-2 rounded-full transition-colors ${isNotifOpen ? "bg-blue-50 text-primary" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 text-sm">
                  Mis Notificaciones
                </h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="px-4 py-3 border-b border-gray-50 hover:bg-blue-50/50 transition-colors flex gap-3"
                    >
                      <div
                        className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.type === "LOGIN" ? "bg-green-500" : notif.type === "LOAN" ? "bg-blue-500" : "bg-orange-500"}`}
                      ></div>
                      <div>
                        <p className="text-xs text-gray-700 leading-snug">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{" "}
                          {formatDateTime(notif.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-400 text-xs">
                    <Info className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    No tienes notificaciones nuevas.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pr-4 border-r border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-700">
              {user?.name || "Estudiante"}
            </p>
            <p className="text-xs text-gray-500">Estudiante</p>
          </div>
          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold border border-blue-100">
            {user?.name?.charAt(0).toUpperCase() || (
              <User className="w-5 h-5" />
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-red-600 transition-colors p-2"
          title="Cerrar Sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
