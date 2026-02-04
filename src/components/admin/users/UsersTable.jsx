import { useState } from "react";
import { Mail, Shield, Calendar, BookOpen } from "lucide-react";
import Pagination from "../../common/Pagination";

export default function UsersTable({
  isLoading,
  users,
  totalItems,
  page,
  totalPages,
  onPageChange,
}) {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (userId) => {
    setImageErrors((prev) => ({ ...prev, [userId]: true }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getActiveLoansCount = (user) => {
    if (!user.loans) return 0;
    return user.loans.filter((l) => l.status === "ACTIVO").length;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4 text-center">Préstamos Activos</th>
              <th className="px-6 py-4">Fecha Registro</th>
              <th className="px-6 py-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-10 text-center text-gray-400"
                >
                  <div className="flex justify-center items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Cargando usuarios...
                  </div>
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user) => {
                const activeLoans = getActiveLoansCount(user);
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden shrink-0 border border-primary/20">
                          {user.avatar_url && !imageErrors[user.id] ? (
                            <img
                              src={user.avatar_url}
                              alt="avatar"
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(user.id)}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            user.full_name?.charAt(0).toUpperCase() || "U"
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {user.full_name || "Sin Nombre"}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          user.role === "admin"
                            ? "bg-purple-50 text-purple-700 border-purple-100"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {user.role === "admin" ? "Administrador" : "Estudiante"}
                      </div>
                    </td>

                    {/* Active Loans Count */}
                    <td className="px-6 py-4 text-center">
                      {user.role === "admin" ? (
                        <span className="text-gray-300">-</span>
                      ) : activeLoans > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                          <BookOpen className="w-3 h-3" /> {activeLoans}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Sin libros
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Activo
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-10 text-center text-gray-400 italic"
                >
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        totalItems={totalItems}
        currentItemsCount={users.length}
        itemLabel="usuarios"
      />
    </div>
  );
}
