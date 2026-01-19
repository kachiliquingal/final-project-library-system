import { Outlet } from "react-router-dom";
import UserHeader from "./UserHeader";

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Header */}
      <UserHeader />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-400 text-xs">
        &copy; {new Date().getFullYear()} Sistema Bibliotecario - Universidad
        Central del Ecuador
      </footer>
    </div>
  );
}
