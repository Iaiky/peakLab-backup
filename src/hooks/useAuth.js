// src/hooks/useAuth.js
import { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // Infos venant de Firestore
  const [loading, setLoading] = useState(true);

  // Inscription + Création profil Firestore
  const register = async (email, password, extraData) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    // On crée un document dans "Users" avec l'ID de l'auth
    await setDoc(doc(db, "Users", res.user.uid), {
      uid: res.user.uid,
      email,
      role: "admin", // Par défaut
      ...extraData,
      createdAt: new Date()
    });
    return res.user;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  
  const logout = () => signOut(auth);

  // Surveillance de la session
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Si l'utilisateur est logué, on récupère son rôle/infos dans Firestore
        const docSnap = await getDoc(doc(db, "Users", currentUser.uid));
        setUserData(docSnap.data());
        setUser(currentUser);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, userData, loading, login, register, logout };
}