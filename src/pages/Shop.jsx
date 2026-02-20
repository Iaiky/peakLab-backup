import { useState } from "react";
import SidebarFilters from "../components/SidebarFilters";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import products from "../assets/products"


export default function Shop() {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleAddToCart = (product, qty = 1) => {
        console.log(`Ajout de ${qty} ${product.name} au panier`);
        // Ta logique d'ajout au panier ici
    };

     // 1. État pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 6; // Nombre de commandes par page

    // 2. Logique de calcul de la pagination
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = products.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(products.length / ordersPerPage);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* 1. On retire la Navbar d'ici car elle est déjà dans App.jsx (grâce au Router) */}
            
            <main className="max-w-7xl mx-auto px-6 pt-28 pb-12">
                {/* Bouton Filtre Mobile - Visible uniquement sur petit écran */}
                <button 
                    onClick={() => setIsFilterOpen(true)}
                    className="lg:hidden mb-6 w-full flex items-center justify-center gap-2 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm active:scale-95 transition-transform"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <span className="font-bold text-slate-700">Filtrer les produits</span>
                </button>
                

                <div className="flex gap-12">
                    {/* Sidebar Drawer */}
                    <div className={`fixed inset-0 z-[999] lg:relative lg:z-0 lg:block ${isFilterOpen ? "visible" : "hidden lg:block"}`}>
                        
                        {/* 1. L'overlay (le fond sombre) - Uniquement sur mobile */}
                        <div 
                            className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity lg:hidden ${isFilterOpen ? "opacity-100" : "opacity-0"}`}
                            onClick={() => setIsFilterOpen(false)}
                        />

                        {/* 2. Le Panneau Blanc */}
                        <div className={`
                            fixed left-0 top-0 h-full w-[280px] bg-white z-[101] p-6 shadow-2xl 
                            transition-transform duration-300 transform
                            ${isFilterOpen ? "translate-x-0" : "-translate-x-full"}
                            lg:relative lg:translate-x-0 lg:w-64 lg:p-0 lg:bg-transparent lg:shadow-none lg:z-0
                        `}>
                            
                            {/* Header Mobile */}
                            <div className="flex justify-between items-center mb-8 lg:hidden">
                                <h2 className="text-xl font-black text-slate-900">Filtres</h2>
                                <button 
                                    onClick={() => setIsFilterOpen(false)}
                                    className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Contenu scrollable (important pour les petits écrans) */}
                            <div className="h-[calc(100vh-120px)] lg:h-auto overflow-y-auto pr-2 custom-scrollbar">
                                <SidebarFilters />
                                
                                {/* Bouton pour fermer et appliquer sur mobile */}
                                <button 
                                    onClick={() => setIsFilterOpen(false)}
                                    className="w-full mt-8 lg:hidden bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform"
                                >
                                    Afficher les résultats
                                </button>
                            </div>
                        </div>
                    </div>
                        
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-2xl font-black text-slate-900">
                                Nos produits <span className="text-secondary font-normal text-lg">({products.length})</span>
                            </h1>
                            {/* Sélecteur de tri */}
                            <select className="bg-transparent border-none text-sm font-bold text-secondary focus:ring-0 cursor-pointer">
                                <option>Plus récents</option>
                                <option>Prix croissant</option>
                            </select>
                        </div>

                        {/* Grille */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {products.map((p) => (
                                /* IMPORTANT : On passe l'ID et l'objet complet. 
                                   On met le onClick sur la carte elle-même.
                                */
                                <div 
                                    key={p.id} 
                                    onClick={() => { 
                                        setSelectedProduct(p); 
                                        setIsModalOpen(true); 
                                    }}
                                >
                                    <ProductCard id={p.id} {...p} />
                                </div>
                            ))}
                        </div>

                        {/* BARRE DE PAGINATION */}
                        {totalPages > 1 && (
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center items-center gap-2">
                            <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 text-slate-400 hover:text-primary disabled:opacity-30 transition"
                            >
                            ←
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                                currentPage === i + 1 
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                                : 'bg-white text-slate-400 border border-slate-200 hover:border-primary/30'
                                }`}
                            >
                                {i + 1}
                            </button>
                            ))}

                            <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 text-slate-400 hover:text-primary disabled:opacity-30 transition"
                            >
                            →
                            </button>
                        </div>
                        )}
                    </div>  
                </div>
            </main>

            <ProductModal 
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onAddToCart={handleAddToCart} // Le bouton dans la modal
            />
        </div>       
    );
}