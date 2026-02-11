// src/components/admin/AdminSidebar.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Import du contexte

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  // 1. On récupère les infos et la fonction logout
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  };

  // Petite fonction pour extraire les initiales (ex: "Jean Dupont" -> "JD")
  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const menuItems = [
    // { name: 'Tableau de bord', path: '/admin', icon: '📊' },
    { name: 'Stocks', path: '/admin/inventory', icon: '🔄' },
    { name: 'Produits', path: '/admin/products', icon: '📦' },
    { name: 'Groupes', path: '/admin/groups', icon: '🛍️' },
    { name: 'Catégories', path: '/admin/categories', icon: '📁' },
    // { name: 'Clients', path: '/admin/customers', icon: '👥' },
    // { name: 'Commandes', path: '/admin/orders', icon: '🛒' },
    // { name: 'Ventes', path: '/admin/sales', icon: '📜' },
  ];

  return (
    <>
      {/* 1. BOUTON BURGER MOBILE */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-[200] p-3 bg-primary text-white rounded-2xl md:hidden shadow-lg border border-white/10"
        >
          ☰
        </button>
      )}

      {/* 2. OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[180] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 3. LA SIDEBAR */}
      <div className={`
        fixed left-0 top-0 h-full bg-primary text-white flex flex-col z-[190] transition-transform duration-300 w-64
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:pointer-events-auto
        ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}
      `}>
        
        {/* HEADER : LOGO */}
        {/* <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary font-bold">P</div>
            <span className="text-xl font-black tracking-tighter">PEAK<span className="opacity-70">ADMIN</span></span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-white">✕</button>
        </div> */}

        {/* --- NOUVEAU : SECTION PROFIL --- */}
        <div className="px-6 py-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-white text-primary flex items-center justify-center font-bold shadow-lg">
              {getInitials(user?.displayName || user?.email)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate">
                {user?.displayName || 'Utilisateur'}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-black">
                {user?.role || 'Admin'}
              </span>
            </div>
          </div>
        </div>

        {/* NAVIGATION MAIN */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive 
                  ? 'bg-white text-primary shadow-lg' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* --- NOUVEAU : SECTION BAS (DECONNEXION) --- */}
        <div className="p-4 mt-auto border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-200 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all font-medium group"
          >
            {/* Icône de déconnexion moderne */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 transition-transform group-hover:translate-x-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
              />
            </svg>
            
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
}