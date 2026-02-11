export default function FiltersHistory({
  searchValue,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onSubmit,
  onReset,
  loading = false,
  placeholder = "Rechercher...",
}) {
  const hasFilters = searchValue || startDate || endDate;

  return (
    <div className="w-full max-w-4xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex flex-wrap items-center gap-3 mb-8"
      >
        {/* 🔍 Search */}
        <div className="relative group w-full">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white border-none rounded-2xl py-4 pl-11 pr-4 text-xs shadow-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 transition-all font-medium"
          />
        </div>

        {/* 📅 Dates + Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full items-end">
          {/* Date début */}
          <div className="flex-1 w-full relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                Du
              </span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full bg-white border-none rounded-2xl py-3.5 pl-12 pr-4 text-xs shadow-sm focus:ring-2 focus:ring-primary/20 text-slate-500 font-medium cursor-pointer transition-all"
            />
          </div>

          {/* Date fin */}
          <div className="flex-1 w-full relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                Au
              </span>
            </div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full bg-white border-none rounded-2xl py-3.5 pl-12 pr-4 text-xs shadow-sm focus:ring-2 focus:ring-primary/20 text-slate-500 font-medium cursor-pointer transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-row gap-2 w-full sm:w-auto">
            {hasFilters && (
              <button
                type="button"
                onClick={onReset}
                className="flex-1 sm:w-[46px] h-[46px] bg-slate-100 text-slate-500 rounded-2xl hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all flex items-center justify-center border border-slate-200"
                title="Effacer les filtres"
              >
                ✕
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`${
                hasFilters ? "flex-[2]" : "w-full"
              } sm:w-auto h-[46px] px-8 bg-secondary text-white rounded-2xl shadow-lg shadow-secondary/20 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="font-bold text-xs uppercase tracking-widest">
                  Filtrer
                </span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
