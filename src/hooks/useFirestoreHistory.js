import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "../firebase/config";

export function useFirestoreHistory(collectionName, options = {}) {
  const { 
    pageSize = 7, 
    searchField = "Produit", 
    dateField = "DateAjout" 
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  
  // Lecture des paramètres de l'URL
  const page = Number(searchParams.get("page")) || 1;

  const setPage = (newPageOrFn) => {
    const nextPage = typeof newPageOrFn === 'function' 
      ? newPageOrFn(page) 
      : newPageOrFn;
      
    // On met à jour l'URL, ce qui déclenchera le useEffect automatiquement
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", nextPage);
    setSearchParams(newParams);
  };

  const activeSearch = searchParams.get("search") || "";
  const activeStart = searchParams.get("start") || "";
  const activeEnd = searchParams.get("end") || "";

  // États locaux pour les formulaires (Inputs)
  const [searchInput, setSearchInput] = useState(activeSearch);
  const [startDate, setStartDate] = useState(activeStart);
  const [endDate, setEndDate] = useState(activeEnd);

  // --- LOGIQUE DES FILTRES ---

  const handleSearch = () => {
    const params = { page: 1 }; // On reset toujours à la page 1 lors d'une recherche
    if (searchInput) params.search = searchInput;
    if (startDate) params.start = startDate;
    if (endDate) params.end = endDate;
    
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchInput("");
    setStartDate("");
    setEndDate("");
    setSearchParams({}); // Vide l'URL
  };

  // --- LOGIQUE DE RÉCUPÉRATION ---

  const loadData = async (targetPage) => {
    setLoading(true);
    try {
      const colRef = collection(db, collectionName);
      const constraints = [orderBy(dateField, "desc")];

      // Filtres Firebase
      if (activeSearch) {
        constraints.push(where(searchField, ">=", activeSearch));
        constraints.push(where(searchField, "<=", activeSearch + "\uf8ff"));
      }
      if (activeStart) {
        const d = new Date(activeStart);
        d.setHours(0, 0, 0, 0);
        constraints.push(where(dateField, ">=", d));
      }
      if (activeEnd) {
        const d = new Date(activeEnd);
        d.setHours(23, 59, 59, 999);
        constraints.push(where(dateField, "<=", d));
      }

      // On récupère tout jusqu'à la page suivante pour tester le "hasNext"
      const totalToFetch = targetPage * pageSize + 1;
      constraints.push(limit(totalToFetch));

      const snapshot = await getDocs(query(colRef, ...constraints));

      const allDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Formatage de date par défaut (optionnel ici, peut être fait dans l'UI)
        date: doc.data()[dateField]?.toDate().toLocaleString("fr-FR"),
      }));

      const startIndex = (targetPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      setData(allDocs.slice(startIndex, endIndex));
      setHasNext(allDocs.length > endIndex);

    } catch (error) {
      console.error(`Erreur sur ${collectionName}:`, error);
      setData([]);
    }
    setLoading(false);
  };

  // --- EFFETS ---

  // Déclencheur : Si l'URL change, on recharge les données et synchronise les inputs
  useEffect(() => {
    loadData(page);
    setSearchInput(activeSearch);
    setStartDate(activeStart);
    setEndDate(activeEnd);
  }, [searchParams]); 

  return {
    data,
    loading,
    page,
    hasNext,
    setPage,
    // Formulaire
    searchInput, setSearchInput,
    startDate, setStartDate,
    endDate, setEndDate,
    handleSearch,
    handleReset,
    // Valeurs actives
    activeSearch, activeStart, activeEnd
  };
}