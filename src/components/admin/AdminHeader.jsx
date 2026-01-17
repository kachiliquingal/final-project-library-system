import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Bell, Clock, Info } from "lucide-react";
import { supabase } from "../../api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "../../hooks/useRealtime";

export default function AdminHeader({ title }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  // 1. Cargar notificaciones
  const { data: notifications = [] } = useQuery({
    queryKey: ["admin-notifications", user?.id],
    queryFn: async () => {
      // Filtro inteligente: Préstamos/Devoluciones de todos, Logins solo míos
      const filterCondition = `type.in.(LOAN,RETURN),and(type.eq.LOGIN,user_id.eq.${user.id})`;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(filterCondition)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 0,
  });

  // 2. Realtime
  useRealtime("notifications", () => {
    queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
  });

  // 3. Marcar como leídas
  const markAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds);
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) markAsRead();
    setIsOpen(!isOpen);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // 🟢 FORMATO MEJORADO: FECHA + HORA (Ej: 17 ene, 05:18 p. m.)
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("es-EC", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <header className="bg-white h-20 px-8 flex items-center justify-between shadow-sm sticky top-0 z-40">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>

      <div className="flex items-center gap-6">
        {/* Notificaciones */}
        <div className="flex items-center gap-4" ref={dropdownRef}>
          <button
            onClick={handleToggle}
            className={`relative p-2 rounded-full transition-colors ${isOpen ? "bg-blue-50 text-primary" : "hover:bg-gray-100 text-gray-600"}`}
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {isOpen && (
            <div className="absolute top-16 right-20 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 text-sm">
                  Notificaciones del Sistema
                </h3>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="px-4 py-3 border-b border-gray-50 hover:bg-blue-50/50 transition-colors flex gap-3"
                    >
                      <div
                        className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                          notif.type === "LOGIN"
                            ? "bg-green-500"
                            : notif.type === "LOAN"
                              ? "bg-blue-500"
                              : "bg-orange-500"
                        }`}
                      ></div>
                      <div>
                        <p className="text-sm text-gray-700 leading-snug">
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
                  <div className="p-6 text-center text-gray-400 text-sm">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    Sin novedades recientes.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-700">
                {user?.name || "Administrador"}
              </p>
              <p className="text-xs text-gray-500 uppercase">
                {user?.role || "Admin"}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
