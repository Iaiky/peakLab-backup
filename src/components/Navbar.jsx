import logo from '../assets/logo_peak_lab.jpg';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();

  const getInitials = () => {
    if (user?.initiales) return user.initiales;
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return "??";
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        
        {/* LOGO : Texte masqué sur mobile, visible sur tablette/desktop */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer group">
          <img src={logo} alt="Logo" className="w-9 h-9 md:w-10 md:h-10 object-contain group-hover:scale-105 transition-transform" />
          <div className="text-lg md:text-xl font-black tracking-tighter text-slate-900 ">
            PEAKLAB <span className="text-primary font-bold">PERFORMANCE</span>
          </div>
        </Link>

        {/* ACTIONS DROITE */}
        <div className="flex items-center gap-2 md:gap-6">
          
          {/* PANIER */}
          <Link to="/cart" className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="absolute top-1 right-1 bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">
              {totalItems}
            </span>
          </Link>

          {/* AUTHENTIFICATION */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
              <Link to="/profile" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-primary/20">
                  {getInitials()}
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-slate-900 leading-none">
                    {user.displayName || user.name || "Mon Profil"}
                  </p>
                </div>
              </Link>
              
              {/* BOUTON DE DECONNEXION */}
              <button 
                onClick={logout} 
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Se déconnecter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            /* VERSION MOBILE : Icône Utilisateur / VERSION DESKTOP : Texte */
            <Link 
              to="/auth" 
              className="flex items-center gap-2 bg-primary text-white p-2.5 md:px-6 md:py-2.5 rounded-full text-sm font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden md:block">Se connecter</span>
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
}