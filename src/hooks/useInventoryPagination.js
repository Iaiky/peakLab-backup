import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "../firebase/config";

export function useInventoryPagination(pageSize = 5) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasNext, setHasNext] = useState(false);

  // Valeurs depuis l'URL
  const page = Number(searchParams.get("page")) || 1;
  const activeSearch = searchParams.get("search") || "";
  const activeGroup = searchParams.get("group") || "";

  // État local pour l'input (pour éviter de recharger à chaque lettre tapée)
  const [searchInput, setSearchInput] = useState(activeSearch);

  const loadData = async () => {

    if (!activeGroup) return;

    setLoading(true);
    try {
      const colRef = collection(db, "produits");
      let constraints = [
        where("IdGroupe", "==", activeGroup), 
        orderBy("Nom")
      ];

      if (activeSearch) {
        // Recherche simple par préfixe (attention: sensible à la casse dans Firebase)
        constraints.push(where("Nom", ">=", activeSearch));
        constraints.push(where("Nom", "<=", activeSearch + "\uf8ff"));
      }

      // On récupère tout jusqu'à la page actuelle + 1 pour détecter s'il y a une suite
      const totalToFetch = page * pageSize + 1;
      constraints.push(limit(totalToFetch));

      const snapshot = await getDocs(query(colRef, ...constraints));
      const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const startIndex = (page - 1) * pageSize;
      const currentPageData = allDocs.slice(startIndex, startIndex + pageSize);
      
      setData(currentPageData);
      setHasNext(allDocs.length > startIndex + pageSize);
    } catch (error) {
      console.error("Erreur Firestore Inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Synchro de l'input si l'utilisateur change l'URL manuellement ou via "back"
    setSearchInput(activeSearch);
  }, [page, activeSearch, activeGroup]);

  const updateFilters = (newSearch, newGroup) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1"); // Reset page 1 sur nouvelle recherche
    if (newSearch !== undefined) {
      newSearch ? params.set("search", newSearch) : params.delete("search");
    }
    
    if (newGroup !== undefined) {
      params.set("group", newGroup);
    }
    
    setSearchParams(params);
  };

  const setPage = (newPageOrFn) => {
    const params = new URLSearchParams(searchParams);
    // Permet de gérer les deux cas : setPage(2) ou setPage(p => p + 1)
    const finalPage = typeof newPageOrFn === 'function' 
        ? newPageOrFn(page) 
        : newPageOrFn;
        
    params.set("page", finalPage.toString());
    setSearchParams(params);
    };

  return {
    data, 
    setData,       
    refresh: loadData,
    loading, 
    page, 
    hasNext, 
    setPage,
    searchInput, 
    activeSearch,
    activeGroup,
    setSearchInput, 
    updateFilters
  };
}