import { useState, useEffect } from 'react';
import { useAdminProduct } from '../../hooks/useAdminProduct';
import { Link } from 'react-router-dom';
import { db, storage } from '../../firebase/config'
import { collection, getDocs, doc, deleteDoc, updateDoc, increment, query, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AdminProductDetailModal from '../../components/admin/AdminProductDetailModal'
import PaginationHistory from '../../components/history/PaginationsHistory';
import { useGroups } from '../../hooks/useGroup';
import { useCategories } from '../../hooks/useCategorie';

export default function AdminProducts() {

  const { groups } = useGroups();
  const { categories: allCategoriesDocs } = useCategories(); // On récupère les objets cat complets

  const {
    products, 
    allProducts, 
    loading, 
    page, 
    hasNext, 
    setPage,
    searchInput, 
    setSearchInput, 
    updateFilters, 
    activeCategory, 
    activeSearch,
    setAllProducts,
    activeGroup,
  } = useAdminProduct(5);

  // État local pour les onglets
  const [currentGroupId, setCurrentGroupId] = useState(activeGroup || "");

  // Mettre à jour le groupe quand les groupes sont chargés
  useEffect(() => {
    if (groups.length > 0 && !currentGroupId) {
      handleGroupChange(groups[0].id);
    }
  }, [groups]);

  const handleGroupChange = (groupId) => {
    setCurrentGroupId(groupId);
    // On réinitialise la catégorie quand on change de groupe pour éviter les mélanges
    updateFilters(activeSearch, "Toutes les catégories", groupId); 
  };

  // Filtrer les catégories pour le select selon le groupe actif
  const filteredCategoriesForSelect = allCategoriesDocs
    .filter(cat => cat.IdGroupe === currentGroupId)

  const getCategoryName = (idCategorie) => {
    if (!idCategorie) return "Général";
    // On cherche l'objet catégorie qui a cet ID
    const cat = allCategoriesDocs.find(c => c.id === idCategorie);
    return cat ? cat.Nom : "Général";
  };

  // --- ÉTATS D'INTERFACE UNIQUEMENT ---
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tempCategory, setTempCategory] = useState(activeCategory);


  // EFFECT 1 : Charger la liste des catégories depuis Firebase (AU DÉMARRAGE)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        // On extrait le champ "Nom" de chaque document
        const cats = querySnapshot.docs.map(doc => doc.data().Nom);
        setCategories(cats);
      } catch (error) {
        console.error("Erreur chargement catégories:", error);
      }
    };
    fetchCategories();
  }, []); // [] signifie : s'exécute une seule fois au chargement de la page

  // EFFECT 2 : Synchroniser les inputs locaux avec l'URL (BACK/FORWARD NAV)
  useEffect(() => {
    setSearchInput(activeSearch || "");
    setTempCategory(activeCategory || "Toutes les catégories");
  }, [activeSearch, activeCategory]);

  const handleFileSelect = (file) => {
    if (!file) return;
    
    // On crée une URL temporaire pour afficher l'image tout de suite dans le modal
    const previewUrl = URL.createObjectURL(file);
    setEditingProduct({
      ...editingProduct,
      image: previewUrl, // Affichage immédiat
      newFile: file      // On stocke le fichier brut pour l'upload plus tard
    });
  };

  const updateCategoryCount = async (catId, value) => {
    if (!catId) return;
    try {
      const catRef = doc(db, "categories", catId);
      await updateDoc(catRef, {
        count: increment(value)
      });
    } catch (e) {
      console.error("Impossible de mettre à jour le compteur", e);
    }
  };

  // --- LOGIQUE DE MISE À JOUR (CRUD) ---
  const handleUpdate = async (e) => {
    e.preventDefault();

    const oldProduct = allProducts.find((p) => p.id === editingProduct.id);
    if (!oldProduct) return;

    try {
      let finalImageUrl = editingProduct.image;

      // 1. Gestion de l'image
      if (editingProduct.newFile) {
        const storageRef = ref(storage, `produits/${editingProduct.id}_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, editingProduct.newFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }

      // 2. Préparation des données (on utilise les IDs)
      const productRef = doc(db, "produits", editingProduct.id);
      const updatedFields = {
        Nom: editingProduct.Nom,
        Prix: Number(editingProduct.Prix),
        Stock: Number(editingProduct.Stock),
        Poids: Number(editingProduct.Poids),
        // ON UTILISE LES IDS ICI
        IdCategorie: editingProduct.IdCategorie, 
        IdGroupe: currentGroupId, // On s'assure qu'il reste dans le bon groupe
        image: finalImageUrl,
      };

      // 3. Mise à jour Firestore
      await updateDoc(productRef, updatedFields);

      // 4. Mise à jour des compteurs (seulement si la catégorie a changé)
      // On compare les IDs, c'est beaucoup plus fiable
      if (oldProduct.IdCategorie !== editingProduct.IdCategorie) {
        // Rappel : updateCategoryCount doit maintenant accepter un ID en paramètre
        if (oldProduct.IdCategorie) await updateCategoryCount(oldProduct.IdCategorie, -1);
        if (editingProduct.IdCategorie) await updateCategoryCount(editingProduct.IdCategorie, 1);
      }

      // 5. Mise à jour locale du State
      const updatedProduct = { ...editingProduct, ...updatedFields };
      delete updatedProduct.newFile;

      setAllProducts(
        allProducts.map((p) => (p.id === editingProduct.id ? updatedProduct : p))
      );

      setEditingProduct(null);
      alert("Produit mis à jour !");
    } catch (error) {
      console.error("Erreur lors de l'update:", error);
      alert("Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (productId, name, categoryId) => {
    if (window.confirm(`Voulez-vous vraiment supprimer ${name} ?`)) {
      try {
        // 1. Suppression du produit
        await deleteDoc(doc(db, "produits", productId));

        // 2. Mise à jour du compteur de la catégorie (via ID)
        if (categoryId) {
          await updateCategoryCount(categoryId, -1);
        }

        // 3. OPTIONNEL : Mise à jour du compteur du groupe
        // Si tu as un champ "NombreProduit" dans ta collection "groupes"
        if (currentGroupId) {
          const groupRef = doc(db, "Groupes", currentGroupId);
          await updateDoc(groupRef, {
            NombreProduit: increment(-1)
          }).catch(() => console.log("Pas de compteur global pour ce groupe"));
        }

        // 4. Mise à jour locale du State (UI)
        setAllProducts((prev) => prev.filter(p => p.id !== productId));
        
        alert("Produit supprimé avec succès !");
      } catch (error) {
        console.error("Erreur suppression:", error);
        alert("Erreur lors de la suppression.");
      }
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* HEADER DE LA PAGE - Adaptatif */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-10 pt-12 md:pt-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">
            Gestion des <span className="text-primary">Produits</span>
          </h1>
          <p className="text-secondary font-medium text-xs md:text-sm">Gérez votre catalogue d'articles.</p>
        </div>
        
        <Link 
            to="/admin/products/add" 
            className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 text-sm"
        >
            <span className="text-xl">+</span> Nouveau Produit
        </Link>
      </div>

      {/* NAVIGATION PAR GROUPES (TABS) */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => handleGroupChange(group.id)}
            className={`px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all whitespace-nowrap ${
              currentGroupId === group.id 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
              : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {group.Nom}
          </button>
        ))}
      </div>

      {/* BARRE DE RECHERCHE ET FILTRES - Stacked sur mobile */}
      <div className="bg-white p-3 md:p-4 rounded-2xl mb-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 md:gap-4 items-center">
        {/* Input de recherche */}
        <div className="flex-1 w-full relative">
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateFilters(searchInput, tempCategory)}
            placeholder="Rechercher une référence..."
            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Select Catégorie (Ne déclenche plus updateFilters) */}
        <select 
          className="w-full md:w-auto bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-secondary outline-none"
          value={tempCategory}
          onChange={(e) => setTempCategory(e.target.value)}
        >
          <option value="Toutes les catégories">Toutes les catégories</option>
          {filteredCategoriesForSelect.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.Nom}
            </option>
          ))}
        </select>

        {/* Groupe de Boutons */}
        <div className="flex w-full md:w-auto gap-2">
          <button
            onClick={() => updateFilters(searchInput, tempCategory)} // On applique tout ici
            className="flex-1 md:flex-none bg-primary text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md shadow-primary/10 hover:bg-primary/90 transition-all"
          >
            Filtrer
          </button>

          {/* Le bouton Réinitialiser s'affiche UNIQUEMENT si un filtre est actif dans l'URL */}
          {(activeSearch !== "" || activeCategory !== "Toutes les catégories") && (
            <button
              onClick={() => {
                setSearchInput("");
                setTempCategory("Toutes les catégories");
                updateFilters("", "Toutes les catégories");
              }}
              className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all border border-red-100"
              title="Effacer les filtres"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* TABLEAU DES PRODUITS - Scroll horizontal forcé sur mobile */}
      <div className="bg-transparent md:bg-white md:rounded-[2.5rem] md:shadow-sm md:border md:border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center font-bold text-slate-400">Chargement du catalogue...</div>
        ) : (
          <>
            {/* --- VUE MOBILE : CARDS (Visible uniquement sur mobile < 768px) --- */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {products.map((product) => (
                <div key={product.id} 
                className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 relative"
                onClick={() => setSelectedProduct(product)}
                >
                  {/* Header : Image + Nom + Poids */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {product.image ? <img src={product.image} alt="" className="w-full h-full object-cover"/> : <span className="text-[8px] font-bold text-slate-400">NO IMG</span>}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 uppercase mb-1 inline-block">
                        {getCategoryName(product.IdCategorie)}
                      </span>
                      <p className="font-bold text-slate-900 text-base truncate">{product.Nom}</p>
                      <p className="text-[11px] text-secondary font-medium uppercase">{product.Poids} kg</p>
                    </div>
                  </div>

                  {/* Détails : Prix et Stock */}
                  <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Prix</p>
                      <p className="font-black text-slate-900 text-lg">{product.Prix.toLocaleString()}Ar</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Stock</p>
                      <div className="flex items-center gap-2 justify-end">
                        <div className={`w-2 h-2 rounded-full ${product.Stock > 10 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        <span className="font-bold text-sm text-slate-700">{product.Stock} unités</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions flottantes */}
                  <div 
                    className="absolute top-4 right-4 flex gap-1" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      onClick={() => setEditingProduct(product)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg shadow-sm"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id, product.Nom, product.IdCategorie)}
                      className="p-2 bg-red-50 text-red-500 rounded-lg shadow-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* --- VUE DESKTOP : TABLEAU (Caché sur mobile) --- */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] uppercase tracking-widest text-secondary font-black">
                    <th className="px-8 py-5">Produit</th>
                    <th className="px-6 py-5">Catégorie</th>
                    <th className="px-6 py-5">Prix</th>
                    <th className="px-6 py-5">Stock</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map((product) => (
                    <tr 
                      key={product.id} 
                      className="hover:bg-slate-50/80 transition-colors group"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {/* ... Garde exactement tes <td> actuels ici ... */}
                      <td className="px-8 py-5">
                        {/* Ton contenu actuel pour Produit */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-400">
                              {product.image ? <img src={product.image} alt="" className="rounded-xl h-full w-full object-cover"/> : "NO IMG"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-sm truncate group-hover:text-primary transition-colors">{product.Nom}</p>
                              <p className="text-[10px] text-secondary font-medium uppercase tracking-tighter">{product.Poids} kg</p>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-lg text-slate-600">{getCategoryName(product.IdCategorie)}</span>
                      </td>
                      <td className="px-6 py-5 font-black text-slate-900 text-base">{product.Prix.toLocaleString()}Ar</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${product.Stock > 10 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                            <span className="font-bold text-sm text-slate-700">{product.Stock} unités</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingProduct(product)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition">✏️</button>
                          <button onClick={() => handleDelete(product.id, product.Nom, product.IdCategorie)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition">🗑️</button>
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
                  {activeSearch || (activeCategory !== "Toutes les catégories")
                    ? "Aucun produit trouvé" 
                    : "Inventaire vide"}
                </h3>

                <p className="text-sm text-slate-500 max-w-[280px] mx-auto mt-2 leading-relaxed">
                  {activeSearch || (activeCategory !== "Toutes les catégories")
                    ? `Aucun résultat pour ces critères. Essayez de modifier votre recherche ou la catégorie.` 
                    : "Il n'y a encore aucun produit enregistré dans votre inventaire."}
                </p>

                {/* Bouton de réinitialisation rapide */}
                {(activeSearch || activeCategory !== "Toutes les catégories") && (
                  <button 
                    onClick={() => {
                      setSearchInput("");
                      setTempCategory("Toutes les catégories");
                      updateFilters("", "Toutes les catégories");
                    }}
                    className="mt-8 px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-primary transition-colors shadow-lg shadow-slate-200"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}

            {/* PAGINATION SIMPLIFIÉE */}
            <PaginationHistory 
              page={page}
              hasNext={hasNext}
              loading={loading}
              // On affiche la pagination seulement s'il y a plus d'une page possible
              show={!loading && (page > 1 || hasNext)} 
              onPrev={() => setPage(page - 1)}
              onNext={() => setPage(page + 1)}
            />
          </>
        )}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Modifier le produit</h2>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              
              {/* SECTION IMAGE : Drag & Drop + Sélection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Image du produit</label>
                <div 
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-blue-50'); }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary', 'bg-blue-50'); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-primary', 'bg-blue-50');
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileSelect(file);
                  }}
                  onClick={() => document.getElementById('fileInput').click()}
                  className="group relative flex flex-col items-center justify-center gap-2 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-blue-50 transition-all cursor-pointer overflow-hidden"
                >
                  {/* Input invisible */}
                  <input 
                    id="fileInput"
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                  />

                  {editingProduct.image ? (
                    <>
                      <img src={editingProduct.image} alt="Preview" className="w-24 h-24 object-cover rounded-xl shadow-md" />
                      <span className="text-[10px] font-bold text-primary group-hover:block hidden">Cliquez pour changer</span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">📸</div>
                      <p className="text-[11px] text-slate-500 font-medium text-center">
                        <span className="text-primary font-bold">Glissez une photo</span> ou cliquez ici
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Nom du produit */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Nom du produit</label>
                <input 
                  className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1"
                  value={editingProduct.Nom}
                  onChange={(e) => setEditingProduct({...editingProduct, Nom: e.target.value})}
                />
              </div>

              {/* Grille : Prix, Stock, Catégorie */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Prix (Ar)</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1"
                    value={editingProduct.Prix}
                    onChange={(e) => setEditingProduct({...editingProduct, Prix: Number(e.target.value)})}
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Poids (Kg)</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1"
                    value={editingProduct.Poids}
                    onChange={(e) => setEditingProduct({...editingProduct, Poids: Number(e.target.value)})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Catégorie</label>
                  <select 
                    className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 font-bold text-sm text-slate-700"
                    // ON LIE L'ID ICI
                    value={editingProduct.IdCategorie || ""} 
                    onChange={(e) => setEditingProduct({...editingProduct, IdCategorie: e.target.value})}
                  >
                    <option value="">Choisir une catégorie</option>
                    {/* On n'affiche QUE les catégories du groupe actuel */}
                    {allCategoriesDocs
                      .filter(cat => cat.IdGroupe === currentGroupId)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.Nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingProduct(null)} 
                  className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 font-bold text-white bg-primary rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminProductDetailModal 
        isOpen={!!selectedProduct} 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onEdit={(prod) => {
          setSelectedProduct(null);
          setEditingProduct(prod);
        }}
      />
    </div>
  );
}