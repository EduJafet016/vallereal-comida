export default function Loading() {
  return (
    <main className="p-4 max-w-md mx-auto min-h-screen bg-gray-50 space-y-4 animate-pulse">
      {/* Botón regresar placeholder */}
      <div className="h-8 w-28 bg-gray-200 rounded-full" />

      {/* Header local placeholder */}
      <div className="bg-white p-4 rounded-2xl border space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-6 w-40 bg-gray-200 rounded-lg" />
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
        </div>
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="h-4 w-1/2 bg-gray-100 rounded" />
      </div>

      {/* Categorías placeholder */}
      <div className="space-y-3 pt-2">
        <div className="h-4 w-24 bg-gray-200 rounded border-l-4 border-emerald-500" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white rounded-2xl border p-3.5 flex justify-between items-center">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-48 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-8 bg-emerald-50 rounded-xl" />
          </div>
        ))}
      </div>
    </main>
  );
}