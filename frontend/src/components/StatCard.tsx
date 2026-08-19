import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: string;
  color?: string;
}

export function StatCard({ title, value, change, icon, color = "blue" }: StatCardProps) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    teal: "bg-teal-50 text-teal-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && <p className="text-sm text-green-600 mt-1">{change}</p>}
        </div>
        {icon && (
          <div className={cn("p-3 rounded-lg", colorMap[color] || colorMap.blue)}>
            <span className="text-xl">{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
}
