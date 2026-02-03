import { BookOpen, ClipboardList, CheckSquare, Users } from "lucide-react";

export default function DashboardStatsCards({ stats }) {
  const statCards = [
    {
      label: "Total Libros",
      value: stats.totalBooks,
      icon: BookOpen,
      color: "bg-blue-500",
      bg: "bg-blue-100",
    },
    {
      label: "Préstamos Activos",
      value: stats.activeLoans,
      icon: ClipboardList,
      color: "bg-purple-500",
      bg: "bg-purple-100",
    },
    {
      label: "Disponibles",
      value: stats.availableBooks,
      icon: CheckSquare,
      color: "bg-green-500",
      bg: "bg-green-100",
    },
    {
      label: "Usuarios",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-orange-500",
      bg: "bg-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">
              {stat.label}
            </p>
            <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${stat.color} text-white shadow-md`}>
            <stat.icon className="w-6 h-6" />
          </div>
        </div>
      ))}
    </div>
  );
}
