import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, increment, query, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Link } from 'react-router-dom';

export default function AdminAddProduct() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // États pour les données
  const [formData, setFormData] = useState({
    Nom: '',
    Categorie: '',
    Prix: '',
    Poids: '',
    Stock: '',
    Description: ''
  });
  
  const [imageFile, setImageFile] = useState(null); // Le vrai fichier binaire
  const [imagePreview, setImagePreview] = useState(null); // L'aperçu pour l'écran
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Charger les catégories dynamiquement
  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, "categories"));
      const cats = snap.docs.map(doc => doc.data().Nom);
      setCategories(cats);
      
      // Correction : Si on a des catégories, on sélectionne la première par défaut
      if (cats.length > 0) {
        setFormData(prev => ({ ...prev, Categorie: cats[0] }));
      }
    };
    fetchCategories();
  }, []);

  // 3. LA FONCTION MAGIQUE HANDLEFILE (Expliquée plus bas)
  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file); // On garde le binaire pour l'upload
      setImagePreview(URL.createObjectURL(file)); // On crée l'aperçu visuel
    }
  };

  // Gestion du Drag & Drop
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const updateCategoryCount = async (categoryName, value) => {
    const q = query(collection(db, "categories"), where("Nom", "==", categoryName));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const catDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "categories", catDoc.id), {
        count: increment(value) // Utilise increment(1) pour ajouter
      });
    }
  };

  // 4. L'ENVOI À FIREBASE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert("Veuillez ajouter une image !");
    
    setLoading(true);
    try {
      // A. Upload de l'image
      const storageRef = ref(storage, `produits/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const url = await getDownloadURL(storageRef);

      // B. Envoi des données texte + URL de l'image
      const stockInitial = Number(formData.Stock) || 0;
      const prixInitial = Number(formData.Prix) || 0;

      const productData = {
        ...formData,
        Categorie: formData.Categorie,
        Prix: prixInitial,
        Poids: Number(formData.Poids) || 0,
        Stock: stockInitial,
        image: url,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "produits"), productData);
      // C. CRÉATION DU MOUVEMENT DE STOCK INITIAL
      // Si le stock initial est > 0, on enregistre l'entrée
      if (Number(formData.Stock) > 0) {
        await addDoc(collection(db, "MouvementsStock"), {
          Produit: formData.Nom,
          ProductId: docRef.id, // On utilise l'ID qu'on vient de générer
          Quantite: stockInitial,
          PrixUnitaire: prixInitial,
          Motif: "Ajout initial du produit",
          TypeMouvement: "Entrée",
          DateAjout: serverTimestamp()
        });
      }
      
      // D. Mise à jour des compteurs de catégorie
      await updateCategoryCount(formData.Categorie, 1);

      navigate('/admin/products');
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'ajout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl">

      <Link to="/admin/products" className="inline-flex items-center text-secondary font-bold text-xs md:text-sm hover:text-primary transition-colors gap-2">
          ← <span className="hidden sm:inline">Retour à la liste des produits</span><span className="sm:hidden">Liste des produits</span>
        </Link>

      <div className="flex items-center gap-4 mb-8">
        {/* <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition">
          ←
        </button> */}
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
          Nouveau <span className="text-primary">Produit</span>
        </h1>
      </div>

      <form 
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        onSubmit={ handleSubmit }
      >
        {/* COLONNE GAUCHE : INFOS TEXTE */}
        <div className="md:col-span-2 space-y-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-black uppercase text-secondary tracking-widest px-1">Nom du produit</label>
              <input 
                required
                type="text" 
                placeholder="ex: Whey Isolate Native" 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary" 
                onChange={(e) => setFormData({...formData, Nom: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-secondary tracking-widest px-1">
                Catégorie
              </label>
              <select 
                required
                // On lie la valeur à l'état pour que React sache toujours ce qui est sélectionné
                value={formData.Categorie} 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary font-medium"
                onChange={(e) => setFormData({...formData, Categorie: e.target.value})}
              >
                {/* Option vide pour forcer l'utilisateur à choisir s'il n'y a pas encore de sélection */}
                {/* <option value="" disabled>Sélectionner une catégorie</option> */}
                
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-secondary tracking-widest px-1">Prix (Ar)</label>
              <input 
                required
                type="number" 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary" 
                onChange={(e) => setFormData({...formData, Prix: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-secondary tracking-widest px-1">Poids (kg)</label>
              <input 
                required
                type="number" 
                step="0.1" 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary" 
                onChange={(e) => setFormData({...formData, Poids: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-secondary tracking-widest px-1">Stock Initial</label>
              <input 
                required
                type="number" 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary" 
                onChange={(e) => setFormData({...formData, Stock: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-secondary tracking-widest px-1">Description</label>
            <textarea 
              rows="4" 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary"
              onChange={(e) => setFormData({...formData, Description: e.target.value})}
            ></textarea>
          </div>
        </div>

        {/* COLONNE DROITE : IMAGE & ACTIONS */}
        <div className="space-y-6">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            className={`
              aspect-square rounded-[2.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden relative
              ${isDragging ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-primary/50'}
            `}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6">
                <span className="text-4xl mb-4 block">📸</span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Glissez votre photo ici ou cliquez</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={(e) => handleFile(e.target.files[0])} className="hidden" accept="image/*" />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:bg-slate-300"
          >
            {loading ? "Enregistrement..." : "Enregistrer le produit"}
          </button>
        </div>
      </form>
    </div>
  );
}