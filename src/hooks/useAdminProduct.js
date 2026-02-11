import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "../firebase/config";

export function useAdminProduct(pageSize = 5) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]); // Nos produits affichés
  const [allProducts, setAllProducts] = useState([]); // Stock complet pour MAJ locale
  const [loading, setLoading] = useState(true);
  const [hasNext, setHasNext] = useState(false);

  // Synchro avec l'URL
  const page = Number(searchParams.get("page")) || 1;
  const activeSearch = searchParams.get("search") || "";
  const activeCategory = searchParams.get("category") || "Toutes les catégories";

  const [searchInput, setSearchInput] = useState(activeSearch);

  const loadData = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, "produits");
      let constraints = [orderBy("Nom")];

      // Filtre Catégorie
      if (activeCategory !== "Toutes les catégories") {
        constraints.push(where("Categorie", "==", activeCategory));
      }

      // Filtre Recherche (préfixe)
      if (activeSearch) {
        constraints.push(where("Nom", ">=", activeSearch));
        constraints.push(where("Nom", "<=", activeSearch + "\uf8ff"));
      }

      // Pagination logique
      const totalToFetch = page * pageSize + 1;
      constraints.push(limit(totalToFetch));

      const snapshot = await getDocs(query(colRef, ...constraints));
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const startIndex = (page - 1) * pageSize;
      const currentPageData = items.slice(startIndex, startIndex + pageSize);

      setProducts(currentPageData);
      setAllProducts(items); // Utile pour tes fonctions Update/Delete
      setHasNext(items.length > startIndex + pageSize);
    } catch (error) {
      console.error("Erreur hook:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setSearchInput(activeSearch);
  }, [page, activeSearch, activeCategory]);

  // AJOUTE CE DÉPENDANCE :
    useEffect(() => {
    const startIndex = (page - 1) * pageSize;
    const currentPageData = allProducts.slice(startIndex, startIndex + pageSize);
    setProducts(currentPageData);
    }, [allProducts, page, pageSize]); // Se déclenche dès que la liste complète change

  const updateFilters = (newSearch, newCat) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    
    if (newSearch !== undefined) {
      newSearch ? params.set("search", newSearch) : params.delete("search");
    }
    if (newCat !== undefined) {
      newCat !== "Toutes les catégories" ? params.set("category", newCat) : params.delete("category");
    }
    setSearchParams(params);
  };

  const setPage = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  return {
    products, allProducts, loading, page, hasNext, setPage,
    searchInput, setSearchInput, updateFilters, activeCategory, setAllProducts,activeSearch,
  activeCategory,
  };
}