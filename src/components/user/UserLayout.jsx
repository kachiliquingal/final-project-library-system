import { Outlet } from "react-router-dom";
import UserHeader from "./UserHeader";

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* 1. Header Superior Fijo */}
      <UserHeader />

      {/* 2. Contenido Principal Centrado */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6">
        <Outlet />
      </main>

      {/* 3. Footer Simple */}
      <footer className="text-center py-6 text-gray-400 text-xs">
        &copy; {new Date().getFullYear()} Sistema Bibliotecario - Universidad Central del Ecuador
      </footer>
    </div>
  );
}