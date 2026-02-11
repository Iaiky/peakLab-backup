import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, collection, runTransaction, serverTimestamp, getDocs } from 'firebase/firestore';
import { useInventoryPagination } from '../../hooks/useInventoryPagination';
import  PaginationHistory  from '../../components/history/PaginationsHistory'
import { useCategories } from '../../hooks/useCategorie';

export default function AdminInventory() {

  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  
  // 1. Récupération du groupe actif depuis l'URL
  const currentGroupId = searchParams.get("group") || "";

  const { 
    data: products, 
    setData,
    loading, 
    page, 
    hasNext, 
    setPage, 
    searchInput, 
    activeSearch,
    setSearchInput, 
    updateFilters 
  } = useInventoryPagination(5);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movementType, setMovementType] = useState('IN');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [comment, setComment] = useState("");

  // 2. Charger les groupes au démarrage
  useEffect(() => {
    const fetchGroups = async () => {
      const snap = await getDocs(collection(db, "Groupes"));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(list);
      
      // Si aucun groupe n'est dans l'URL, on prend le premier
      if (!currentGroupId && list.length > 0) {
        setSearchParams({ group: list[0].id });
      }
    };
    fetchGroups();
  }, [currentGroupId, setSearchParams]);

    // Fonction pour transformer l'IdCategorie en Nom lisible
    // 1. Récupérer les catégories (si ce n'est pas déjà fait)
    const [allCategoriesDocs, setAllCategoriesDocs] = useState([]);
    useEffect(() => {
      const fetchCats = async () => {
        const snap = await getDocs(collection(db, "categories"));
        setAllCategoriesDocs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      fetchCats();
    }, []);

    // 2. LA FONCTION QUI MANQUAIT
    const getCatName = (id) => {
      if (!id) return "Général";
      const found = allCategoriesDocs.find(c => c.id === id);
      return found ? found.Nom : "Général";
    };

  const openMovementModal = (product, type) => {
    setSelectedProduct(product);
    setMovementType(type);
    setIsModalOpen(true);
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    
    // 1. Déclarer la variable à l'extérieur pour qu'elle soit accessible partout dans la fonction
    let updatedStockValue; 
    const moveQty = Number(quantity);

    try {
      const productRef = doc(db, "produits", selectedProduct.id);

      await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) throw "Le produit n'existe plus !";

        const productData = productDoc.data();
        const currentStock = Number(productDoc.data().Stock) || 0;
        
        // 2. Calculer et assigner à la variable de portée supérieure
        updatedStockValue = movementType === 'IN' 
          ? currentStock + moveQty 
          : currentStock - moveQty;
        
        if (movementType === 'OUT' && currentStock < moveQty) {
          throw "Stock insuffisant !";
        }

        transaction.update(productRef, { Stock: updatedStockValue });

        const movementRef = doc(collection(db, "MouvementsStock"));
        transaction.set(movementRef, {
          Produit: selectedProduct.Nom,
          ProductId: selectedProduct.id,
          IdGroupe: productData.IdGroupe,       // On prend l'ID groupe du produit
          IdCategorie: productData.IdCategorie,
          Quantite: moveQty,
          PrixUnitaire: Number(unitPrice),
          Motif: comment,
          TypeMouvement: movementType === 'IN' ? "Entrée" : "Sortie",
          DateAjout: serverTimestamp()
        });
      });

      // 3. Ici, updatedStockValue est bien définie car la transaction a réussi
      setData(prevProducts => 
        prevProducts.map(p => 
          p.id === selectedProduct.id ? { ...p, Stock: updatedStockValue } : p
        )
      );

      // Reset et fermeture
      setIsModalOpen(false);
      setQuantity(1);
      setUnitPrice('');
      setComment("");
      
    } catch (error) { 
      console.error("Erreur transaction:", error);
      alert(error); 
    }
  };

  return (
    <div className="p-4 md:p-8 pt-12 md:pt-8">
      {/* HEADER ADAPTATIF */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 md:mb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">
            Etats<span className="text-primary"> des Stocks</span>
          </h1>
          <p className="text-xs md:text-sm text-secondary font-medium">Contrôle des flux et inventaire</p>
        </div>
        
        {/* ZONE ACTIONS : RECHERCHE + BOUTON */}
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
          
          {/* BARRE DE RECHERCHE AVEC BOUTONS D'ACTION */}
          <div className="relative group w-full">
            <form 
              onSubmit={(e) => { e.preventDefault(); updateFilters(searchInput); }} 
              className="relative flex items-center gap-2 w-full"
            >
              <div className="relative flex-1 group">
                {/* L'icône Loupe */}
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

                {/* L'Input */}
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-white border-none rounded-2xl py-4 pl-11 pr-12 text-xs shadow-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 transition-all font-medium"
                />

                {/* Bouton RESET (X) - S'affiche seulement s'il y a du texte ou un filtre actif */}
                {(searchInput !== "" || activeSearch !== "") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      updateFilters("");
                    }}
                    className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-red-500 transition-colors"
                    title="Réinitialiser"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Bouton VALIDER (Filtrer) */}
              <button
                type="submit"
                className="bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-slate-200 active:scale-95"
              >
                Filtrer
              </button>
            </form>
          </div>

          {/* BOUTON HISTORIQUE */}
          <Link 
            to="/admin/inventory/history"
            className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <span>📜</span> Historique
          </Link>
        </div>
      </div>

      {/* TABS DES GROUPES (MARQUES) */}
      <div className="flex overflow-x-auto gap-2 mb-6 no-scrollbar pb-2">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setSearchParams({ group: group.id })}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              currentGroupId === group.id
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
            }`}
          >
            {group.Nom}
          </button>
        ))}
      </div>

      {/* TABLEAU AVEC SCROLL HORIZONTAL MOBILE */}
      <div className="bg-transparent md:bg-white md:rounded-[2.5rem] md:shadow-sm md:border md:border-slate-100 overflow-hidden">
  
        {/* --- VUE MOBILE : CARDS (Affiche toutes les colonnes) --- */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {products.map((product) => (
            <div key={product.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              
              {/* Ligne 1 : Référence / Produit */}
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <p className="text-[10px] text-secondary font-black uppercase tracking-widest mb-1">Référence</p>
                  <p className="font-black text-slate-900 text-base truncate">{product.Nom}</p>
                  <p className="text-[10px] text-primary font-bold uppercase">{getCatName(product.IdCategorie)}</p>
                </div>
                
                {/* Ligne 2 : Stock (Intégré en haut à droite) */}
                <div className="text-right whitespace-nowrap">
                  <p className="text-[10px] text-secondary font-black uppercase tracking-widest mb-1">Stock</p>
                  <span className={`inline-block px-3 py-1 rounded-lg text-[11px] font-black ${
                    Number(product.Stock) < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {product.Stock || 0} pcs
                  </span>
                </div>
              </div>

              {/* Ligne 3 : Actions (Boutons larges pour mobile) */}
              <div className="pt-4 border-t border-slate-50 flex gap-3">
                <button 
                  onClick={() => openMovementModal(product, 'IN')}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white text-[11px] font-black uppercase py-3 rounded-xl transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>+</span> Arrivage
                </button>
                <button 
                  onClick={() => openMovementModal(product, 'OUT')}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase py-3 rounded-xl transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>-</span> Retrait
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* --- VUE DESKTOP : TABLEAU (Inchangé) --- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[11px] uppercase tracking-widest text-secondary font-black">
                <th className="px-8 py-5">Référence</th>
                <th className="px-6 py-5">Catégorie</th>
                <th className="px-6 py-5">Stock</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900 text-sm">{product.Nom}</p>
                    <p className="text-[10px] text-secondary font-medium uppercase">{getCatName(product.IdCategorie)}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${
                      Number(product.Stock) < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {product.Stock || 0} en stock
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openMovementModal(product, 'IN')}
                        className="bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold px-4 py-2 rounded-xl transition active:scale-95"
                      >
                        + Arrivage
                      </button>
                      <button 
                        onClick={() => openMovementModal(product, 'OUT')}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-4 py-2 rounded-xl transition active:scale-95"
                      >
                        - Retrait
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- ÉTAT VIDE (EMPTY STATE) --- */}
        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
              <svg 
                className="w-10 h-10 text-slate-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="1.5" 
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
                />
              </svg>
            </div>

            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              {activeSearch
                ? "Aucun produit trouvé" 
                : "Inventaire vide"}
            </h3>

            <p className="text-sm text-slate-500 max-w-[280px] mx-auto mt-2 leading-relaxed">
              {activeSearch
                ? `Aucun résultat pour ces critères. Essayez de modifier votre recherche ou la catégorie.` 
                : "Il n'y a encore aucun produit enregistré dans votre inventaire."}
            </p>

            {/* Bouton de réinitialisation rapide */}
            {(activeSearch) && (
              <button 
                onClick={() => {
                  setSearchInput("");
                  updateFilters("");
                }}
                className="mt-8 px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-primary transition-colors shadow-lg shadow-slate-200"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {/* BARRE DE PAGINATION (Adaptée) */}
          {/* PAGINATION */}
          <PaginationHistory 
            page={page} 
            hasNext={hasNext} 
            loading={loading}
            show={true}
            onPrev={() => setPage(page - 1)} // On passe le chiffre directement
            onNext={() => setPage(page + 1)} // On passe le chiffre directement
          />
      </div>

      {/* MODAL RESPONSIVE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative bg-white w-full max-w-md rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-1">
              {movementType === 'IN' ? '📈 Arrivage' : '📉 Sortie'}
            </h2>
            <p className="text-secondary text-xs md:text-sm font-medium mb-6">{selectedProduct?.name}</p>

            <form onSubmit={handleConfirm} className="space-y-4 md:space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                {/* CHAMP QUANTITÉ */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-secondary tracking-widest px-1">Quantité</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl md:rounded-2xl p-3 md:p-4 focus:ring-2 focus:ring-primary font-bold text-base md:text-lg" 
                  />
                </div>

                {/* CHAMP PRIX UNITAIRE */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-secondary tracking-widest px-1">Prix Unitaire (Ar)</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    placeholder="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl md:rounded-2xl p-3 md:p-4 focus:ring-2 focus:ring-primary font-bold text-base md:text-lg text-primary" 
                  />
                </div>
              </div>

              {/* AFFICHAGE DU TOTAL CALCULÉ */}
              {quantity > 0 && unitPrice > 0 && (
                <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest">Valeur totale</span>
                  <span className="font-black text-primary text-lg">{(quantity * unitPrice).toLocaleString('fr-FR')} Ar</span>
                </div>
              )}

              {/* CHAMP RAISON */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-secondary tracking-widest px-1">Raison / Commentaire</label>
                <textarea 
                  required
                  placeholder="Ex: Facture #FR-2026..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl md:rounded-2xl p-3 md:p-4 focus:ring-2 focus:ring-primary h-20 md:h-24 text-sm"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 text-secondary py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm hover:bg-slate-200 transition"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className={`py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm text-white shadow-lg transition transform active:scale-95 ${
                    movementType === 'IN' ? 'bg-green-500 shadow-green-200' : 'bg-slate-900 shadow-slate-200'
                  }`}
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}