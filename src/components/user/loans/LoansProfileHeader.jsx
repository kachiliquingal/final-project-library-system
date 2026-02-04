export default function LoansProfileHeader({
  user,
  activeCount,
  historyCount,
}) {
  return (
    <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center gap-6">
      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/20">
        {user?.name?.charAt(0).toUpperCase() || "U"}
      </div>

      <div className="text-center md:text-left flex-1">
        <h2 className="text-2xl font-bold">{user?.name}</h2>
        <p className="text-blue-200 text-sm">{user?.email}</p>

        <div className="flex gap-4 mt-4 justify-center md:justify-start">
          <div className="bg-white/10 px-4 py-2 rounded-lg text-sm backdrop-blur-sm border border-white/10">
            <span className="font-bold text-white text-lg mr-2">
              {activeCount}
            </span>
            <span className="text-blue-200">Préstamos Activos</span>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-lg text-sm backdrop-blur-sm border border-white/10">
            <span className="font-bold text-white text-lg mr-2">
              {historyCount}
            </span>
            <span className="text-blue-200">Devueltos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
