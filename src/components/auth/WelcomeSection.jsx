import { Book } from "lucide-react";

export default function WelcomeSection() {
  return (
    <div className="text-center md:text-left max-w-lg space-y-6">
      <div className="inline-block p-3 bg-blue-100 rounded-2xl mb-2 shadow-sm">
        <Book className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
        Bienvenido al <br />
        <span className="text-primary">Portal Bibliotecario</span>
      </h1>
      <p className="text-lg text-gray-500 leading-relaxed">
        Accede al catálogo completo de la Facultad de Ingeniería, gestiona tus
        préstamos y descubre nuevos recursos académicos en un solo lugar.
      </p>
      <div className="hidden md:flex items-center gap-4 pt-4">
        <div className="flex -space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">
            U
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">
            C
          </div>
          <div className="w-10 h-10 rounded-full bg-primary border-2 border-white flex items-center justify-center text-xs font-bold text-white">
            E
          </div>
        </div>
        <p className="text-sm font-medium text-gray-400">
          Únete a la comunidad
        </p>
      </div>
    </div>
  );
}
