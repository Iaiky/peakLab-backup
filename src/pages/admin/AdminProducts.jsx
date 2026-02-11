import { useState, useEffect } from 'react';
import { useAdminProduct } from '../../hooks/useAdminProduct';
import { Link } from 'react-router-dom';
import { db, storage } from '../../firebase/config'
import { collection, getDocs, doc, deleteDoc, updateDoc, increment, query, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AdminProductDetailModal from '../../components/admin/AdminProductDetailModal'
import PaginationHistory from '../../components/history/PaginationsHistory';

export default function AdminProducts() {

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
    setAllProducts
  } = useAdminProduct(5);

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

  const updateCategoryCount = async (categoryName, value) => {
    if (!categoryName) return;
    const q = query(collection(db, "categories"), where("Nom", "==", categoryName));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const catDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "categories", catDoc.id), {
        count: increment(value)
      });
    }
  };

  // --- LOGIQUE DE MISE À JOUR (CRUD) ---
  const handleUpdate = async (e) => {
    e.preventDefault();

    // 1. On retrouve l'ancien produit pour comparer la catégorie (utile pour les compteurs)
    const oldProduct = allProducts.find((p) => p.id === editingProduct.id);
    if (!oldProduct) return;

    try {
      let finalImageUrl = editingProduct.image;

      // 2. Gestion de l'image (Firebase Storage)
      if (editingProduct.newFile) {
        const storageRef = ref(storage, `produits/${editingProduct.id}_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, editingProduct.newFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }

      // 3. Préparation des données pour Firestore
      const productRef = doc(db, "produits", editingProduct.id);
      const updatedFields = {
        Nom: editingProduct.Nom,
        Prix: Number(editingProduct.Prix),
        Stock: Number(editingProduct.Stock),
        Categorie: editingProduct.Categorie,
        image: finalImageUrl,
      };

      // 4. Mise à jour effective dans Firestore
      await updateDoc(productRef, updatedFields);

      // 5. Mise à jour des compteurs de catégories si elle a changé
      if (oldProduct.Categorie !== editingProduct.Categorie) {
        await updateCategoryCount(oldProduct.Categorie, -1);
        await updateCategoryCount(editingProduct.Categorie, 1);
      }

      // 6. Mise à jour locale du Hook (pour rafraîchir le tableau immédiatement)
      // On fusionne les anciens champs avec les nouveaux
      const updatedProduct = { ...editingProduct, ...updatedFields };
      delete updatedProduct.newFile; // On nettoie le fichier temporaire

      setAllProducts(
        allProducts.map((p) => (p.id === editingProduct.id ? updatedProduct : p))
      );

      // 7. Fermeture et succès
      setEditingProduct(null);
      alert("Produit mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'update:", error);
      alert("Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (id, name, categoryName) => {
    if (window.confirm(`Voulez-vous vraiment supprimer ${name} ?`)) {
      try {
        await deleteDoc(doc(db, "produits", id));
        await updateCategoryCount(categoryName, -1);

        // MAJ locale instantanée
        setAllProducts((prev) => prev.filter(p => p.id !== id));
        
        alert("Produit supprimé !");
      } catch (error) {
        console.error("Erreur suppression:", error);
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
          onChange={(e) => setTempCategory(e.target.value)} // On change juste l'état local ici
        >
          <option value="Toutes les catégories">Toutes les catégories</option>
          {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
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
                        {product.Categorie || "Général"}
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
                      onClick={() => handleDelete(product.id, product.Nom, product.Categorie)}
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
                        <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-lg text-slate-600">{product.Categorie || "Général"}</span>
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
                          <button onClick={() => handleDelete(product.id, product.Nom, product.Categorie)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
                    className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 font-bold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary appearance-none"
                    value={editingProduct.Categorie}
                    onChange={(e) => setEditingProduct({...editingProduct, Categorie: e.target.value})}
                  >
                    {categories.map((cat, index) => (
                      <option key={index} value={cat}>{cat}</option>
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