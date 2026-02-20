// src/pages/Auth.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo_peak_lab.jpg';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, googleLogin } = useAuth();

  // 1. Centralisation des données du formulaire
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    address: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2. Fonction unique pour mettre à jour les champs
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    // Vérification de la correspondance des mots de passe à l'inscription
    if (!isLogin && formData.password !== formData.confirmPassword) {
      return setError("Les mots de passe ne correspondent pas.");
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        // Envoi des données séparées au context
        await register(formData.email, formData.password, { 
          firstName: formData.firstName,
          lastName: formData.lastName,
          displayName: `${formData.firstName} ${formData.lastName}`,
          address: formData.address,
          role: 'client' // Par défaut
        });
      }
      navigate("/");
    } catch (err) {
    console.error("Code d'erreur Firebase:", err.code);

    // Gestion précise des messages d'erreur
    switch (err.code) {
      case 'auth/email-already-in-use':
        setError("Cette adresse email est déjà associée à un compte.");
        break;
      case 'auth/invalid-email':
        setError("L'adresse email n'est pas valide.");
        break;
      case 'auth/weak-password':
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        setError("Email ou mot de passe incorrect.");
        break;
      default:
        setError("Une erreur est survenue. Veuillez réessayer.");
    }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await googleLogin();
      navigate("/");
    } catch (err) {
      setError("Connexion Google annulée.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative font-sans">
      
      {/* Bouton retour Boutique */}
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors group">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-sm font-medium">Boutique</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-3 mb-2">
            <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
            <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
              PEAKLAB <span className="text-primary">PERFORMANCE</span>
            </span>
          </div>
          <div className="h-1 w-12 bg-slate-200 rounded-full"></div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-10 border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {isLogin ? "Heureux de vous revoir" : "Rejoignez l'aventure"}
            </h1>
          </div>

          {/* BOUTON GOOGLE */}
          <button 
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-3.5 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all mb-6 shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            {isLogin ? "Se connecter avec Google" : "S'inscrire avec Google"}
          </button>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <span className="relative bg-white px-4 text-xs font-bold text-slate-300 uppercase">Ou par email</span>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl text-center uppercase tracking-wider">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleAuth}>
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Prénom</label>
                    <input 
                      required name="firstName" type="text"
                      value={formData.firstName} onChange={handleChange}
                      placeholder="Jean"
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Nom</label>
                    <input 
                      required name="lastName" type="text"
                      value={formData.lastName} onChange={handleChange}
                      placeholder="Dupont"
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Adresse</label>
                  <input 
                    required name="address" type="text"
                    value={formData.address} onChange={handleChange}
                    placeholder="12 rue des Alpes, Paris"
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Email</label>
              <input 
                required name="email" type="email"
                value={formData.email} onChange={handleChange}
                placeholder="votre@email.com"
                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1 flex justify-between">
                Mot de passe
                {isLogin && <span className="text-primary lowercase font-medium cursor-pointer">Oublié ?</span>}
              </label>
              <input 
                required name="password" type="password"
                value={formData.password} onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* CHAMP CONFIRMATION MOT DE PASSE */}
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Confirmer mot de passe</label>
                <input 
                  required name="confirmPassword" type="password"
                  value={formData.confirmPassword} onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword 
                    ? 'ring-2 ring-rose-500' 
                    : 'focus:ring-primary'
                  }`}
                />
              </div>
            )}

            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg mt-4 disabled:opacity-50"
            >
              {loading ? "Chargement..." : (isLogin ? "Se connecter" : "S'inscrire")}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm font-medium text-slate-400 hover:text-primary transition-colors"
            >
              {isLogin ? "Nouveau ici ? Créer un compte" : "Déjà membre ? Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}