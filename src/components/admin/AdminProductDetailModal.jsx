
const ProductDetailModal = ({ isOpen, product, categoryName, onClose, onEdit }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* max-h-[90vh] : la modale ne dépassera jamais 90% de la hauteur de l'écran */}
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header Image : h-48 sur mobile, h-72 sur desktop */}
        <div className="relative h-48 md:h-72 bg-slate-100 flex-shrink-0">
          {product.image ? (
            <img src={product.image} alt={product.Nom} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">PAS D'IMAGE</div>
          )}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
          >
            ✕
          </button>
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
              {categoryName || "Général"}
            </span>
          </div>
        </div>

        {/* Contenu Scrollable : overflow-y-auto est la clé */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div className="w-full md:max-w-[60%]">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-1 break-words">
                {product.Nom}
              </h2>
              {Number(product.Poids) > 0 && (
                <p className="text-xs text-slate-500 font-bold tracking-tighter">
                  {product.Poids}g / UNITÉ
                </p>
              )}
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Prix unitaire</p>
              <p className="text-2xl md:text-3xl font-black text-primary">
                {product.Prix?.toLocaleString()} Ar
              </p>
            </div>
          </div>

          {/* Description Section */}
          <div className="mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Description</p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed italic">
                {product.Description || "Aucune description disponible."}
              </p>
            </div>
          </div>

          {/* Stock Section */}
          <div className="mb-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Stock</p>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${product.Stock > 10 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                <span className="text-sm font-bold text-slate-700">{product.Stock} unités</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de modale (Actions) - Fixe en bas pour être toujours accessible */}
        <div className="p-6 border-t border-slate-50 flex gap-3 bg-white flex-shrink-0">
          <button 
            onClick={() => onEdit(product)}
            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            ✏️ Modifier
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;