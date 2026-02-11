import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';

export function useGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // On utilise onSnapshot pour que la liste se mette à jour 
    // en temps réel si tu ajoutes/modifies un groupe
    const q = query(collection(db, "Groupes"), orderBy("Nom"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGroups(list);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors de la récupération des groupes");
        setLoading(false);
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    // Nettoyage de l'écouteur à la fermeture du composant
    return () => unsubscribe();
  }, []);

  return { groups, loading, error };
}