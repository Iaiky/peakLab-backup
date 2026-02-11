import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("Nom"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(list);
        setLoading(false);
      } catch (err) {
        console.error("Erreur useCategories:", err);
        setError("Erreur lors de la récupération des catégories");
        setLoading(false);
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    // Nettoyage de l'écouteur
    return () => unsubscribe();
  }, []);

  /**
   * Optionnel : Filtrer les catégories par Groupe
   * Utile si tu veux afficher uniquement les catégories d'une marque précise
   */
  const getCategoriesByGroup = (groupId) => {
    return categories.filter(cat => cat.IdGroupe === groupId);
  };

  return { 
    categories, 
    loading, 
    error,
    getCategoriesByGroup 
  };
}