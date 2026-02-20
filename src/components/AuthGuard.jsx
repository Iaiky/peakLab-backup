// src/components/AuthGuard.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const AuthGuard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si pas connecté ou si le rôle n'est pas admin -> Redirection Accueil
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Si connecté -> On affiche les routes enfants (l'Outlet)
  return <Outlet />;
};