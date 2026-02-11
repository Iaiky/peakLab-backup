import { useState } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { useGroups } from '../../hooks/useGroup';
import { useCategories } from '../../hooks/useCategorie';

export default function AdminCategories() {
  const [newCat, setNewCat] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [editingId, setEditingId] = useState(null);

  // --- Utilisation des Hooks ---
  const { groups } = useGroups();
  const { categories, loading } = useCategories(); // On récupère tout ici

  // 1. CRÉER (Pas besoin de fetchCategories() à la fin, le hook détecte l'ajout seul !)
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCat.trim() || !selectedGroupId) {
      alert("Veuillez saisir un nom et choisir un groupe");
      return;
    }
    try {
      await addDoc(collection(db, "categories"), {
        Nom: newCat,
        IdGroupe: selectedGroupId,
        count: 0
      });
      setNewCat("");
      setSelectedGroupId("");
    } catch (error) {
      alert("Erreur lors de l'ajout");
    }
  };

  // 2. SUPPRIMER
  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette catégorie ?")) {
      try {
        await deleteDoc(doc(db, "categories", id));
      } catch (error) {
        alert("Erreur de suppression");
      }
    }
  };

  // 3. MODIFIER
  const handleEdit = async (id, newName) => {
    if (!newName || !newName.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await updateDoc(doc(db, "categories", id), { Nom: newName });
      setEditingId(null);
    } catch (error) {
      alert("Erreur de modification");
    }
  };

  const getGroupName = (id) => {
    const group = groups.find(g => g.id === id);
    return group ? group.Nom : "Sans groupe";
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen pt-12 md:pt-8">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 md:mb-8 uppercase tracking-tighter">
          Gestion des <span className="text-primary">Catégories</span>
        </h1>

        {/* --- FORMULAIRE : AJOUTER --- */}
        <form onSubmit={handleAdd} className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-3 mb-8">
          
          {/* Input Nom */}
          <input 
            type="text" 
            placeholder="Nom de la catégorie (ex: Isolate)..."
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="flex-1 bg-slate-50 border-none rounded-xl md:rounded-2xl px-4 py-3 md:py-4 text-sm focus:ring-2 focus:ring-primary outline-none"
          />

          {/* Select Groupe (Marque) */}
          <select
            required
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="flex-1 bg-slate-50 border-none rounded-xl md:rounded-2xl px-4 py-3 md:py-4 text-sm focus:ring-2 focus:ring-primary outline-none font-medium text-slate-600"
          >
            <option value="">Choisir une marque (Groupe)</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.Nom}</option>
            ))}
          </select>

          <button className="bg-slate-900 text-white px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-primary transition-all active:scale-95">
            Ajouter +
          </button>
        </form>

        {/* --- LISTE --- */}
        <div className="bg-transparent md:bg-white md:rounded-[2.5rem] md:shadow-sm md:border md:border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-400 font-bold">Chargement...</div>
          ) : (
            <>
              {/* VUE MOBILE */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {categories.map((cat) => (
                  <div key={cat.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    
                    {/* Partie Gauche : Infos (Centrées verticalement grâce au parent flex) */}
                    <div className="flex-1 min-w-0">
                      {/* Augmentation de mb-0.5 vers mb-2 pour décoller le badge du nom */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[8px] font-black uppercase text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                          {getGroupName(cat.IdGroupe)}
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">
                          • {cat.count || 0} produits
                        </span>
                      </div>

                      {editingId === cat.id ? (
                        <input 
                          autoFocus
                          defaultValue={cat.Nom}
                          onBlur={(e) => handleEdit(cat.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEdit(cat.id, e.target.value);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          // Ajout de mt-1 pour l'espace quand l'input apparaît
                          className="bg-slate-50 border-2 border-primary/20 rounded-lg px-2 py-1 font-bold text-primary outline-none w-full mt-1"
                        />
                      ) : (
                        /* mt-0.5 pour créer un petit décalage subtil avec les badges du dessus */
                        <p className="font-bold text-slate-800 truncate text-base leading-tight mt-0.5">
                          {cat.Nom}
                        </p>
                      )}
                    </div>

                    {/* Partie Droite : Actions (Bien alignées au milieu) */}
                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <button 
                        onClick={() => setEditingId(cat.id)} 
                        className="p-2 text-slate-400 active:bg-slate-100 rounded-xl transition-all active:scale-90"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)} 
                        className="p-2 text-red-300 active:bg-red-50 rounded-xl transition-all active:scale-90"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* VUE DESKTOP */}
              <div className="hidden md:block">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 text-secondary text-[10px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Catégorie</th>
                      <th className="px-6 py-5">Groupe (Marque)</th>
                      <th className="px-6 py-5 text-center">Volume</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-5">
                          {editingId === cat.id ? (
                            <input 
                              autoFocus
                              defaultValue={cat.Nom}
                              // On sauvegarde quand l'utilisateur clique ailleurs ou appuie sur Entrée
                              onBlur={(e) => handleEdit(cat.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEdit(cat.id, e.target.value);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="bg-white border-2 border-blue-500/20 rounded-lg px-3 py-1.5 font-bold text-blue-600 outline-none shadow-sm"
                            />
                          ) : (
                            <span className="font-bold text-slate-700 group-hover:text-primary transition-colors">
                              {cat.Nom}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-slate-500 font-medium italic">
                          {getGroupName(cat.IdGroupe)}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                            {cat.count || 0} articles
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right space-x-2">
                          <button 
                            onClick={() => setEditingId(cat.id)} // <--- Change ceci
                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDelete(cat.id)} 
                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}