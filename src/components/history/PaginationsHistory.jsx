export default function PaginationHistory({
  page,
  hasNext,
  loading,
  show,
  onPrev,
  onNext,
}) {
  if (!show) return null;

  return (
    <div className="mt-6 p-6 flex justify-center items-center gap-4">
      <div className="flex items-center gap-2">
        
        {/* Bouton Précédent */}
        <button
          onClick={onPrev}
          disabled={page === 1 || loading}
          className="p-2 text-slate-400 hover:text-primary disabled:opacity-30 transition-all font-bold text-xl"
        >
          ←
        </button>

        <div className="flex gap-2">
          
          {/* Page précédente */}
          {page > 1 && (
            <button
              onClick={onPrev}
              disabled={loading}
              className="w-8 h-8 rounded-lg text-xs font-black bg-white text-slate-400 border border-slate-200 hover:border-primary/30 transition-all"
            >
              {page - 1}
            </button>
          )}

          {/* Page actuelle */}
          <button
            className="w-8 h-8 rounded-lg text-xs font-black bg-primary text-white shadow-lg shadow-primary/20 scale-110 transition-all"
          >
            {page}
          </button>

          {/* Page suivante */}
          {hasNext && (
            <button
              onClick={onNext}
              className="w-8 h-8 rounded-lg text-xs font-black bg-white text-slate-400 border border-slate-200 hover:border-primary/30 transition-all"
            >
              {page + 1}
            </button>
          )}
        </div>

        {/* Bouton Suivant */}
        <button
          onClick={onNext}
          disabled={!hasNext || loading}
          className="p-2 text-slate-400 hover:text-primary disabled:opacity-30 transition-all font-bold text-xl"
        >
          →
        </button>
      </div>
    </div>
  );
}
