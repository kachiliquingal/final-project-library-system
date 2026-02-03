import { CalendarRange } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ActivityChart({ chartData, timeRange }) {
  const getPeriodLabel = () => {
    switch (timeRange) {
      case "all": return "Histórica";
      case "month": return "Últimos 30 días";
      case "week": return "Últimos 7 días";
      case "today": return "Hoy";
      default: return "";
    }
  };

  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <CalendarRange className="w-5 h-5 text-gray-400" />
        Actividad: {getPeriodLabel()}
      </h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              dy={10}
            />
            <Tooltip
              cursor={{ fill: "#f3f4f6" }}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Bar
              dataKey="loans"
              fill="#003666"
              radius={[6, 6, 0, 0]}
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}