import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config'; // Vérifie bien ton chemin
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. SURVEILLANCE DE LA CONNEXION (Remplace ton useEffect localStorage)
  useEffect(() => {
    // Cette fonction de Firebase surveille si l'utilisateur est logué ou non
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Si connecté, on va chercher ses infos bonus (role, etc.) dans Firestore
        const docRef = doc(db, "Users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          ...docSnap.data() // Récupère le role, name, etc.
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. FONCTION DE CONNEXION
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // 3. FONCTION D'INSCRIPTION
  const register = async (email, password, extraData) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    // On crée son profil dans Firestore juste après l'inscription
    await setDoc(doc(db, "Users", res.user.uid), {
      uid: res.user.uid,
      email,
      role: "admin", // Tu peux changer par défaut
      ...extraData,
      createdAt: new Date()
    });
    return res.user;
  };

  // 4. DÉCONNEXION
  const logout = () => signOut(auth);

  //google log in
  const googleLogin = async () => {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  
  // Si c'est sa première fois, on lui crée un profil dans Firestore
  const docRef = doc(db, "Users", res.user.uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    await setDoc(docRef, {
      uid: res.user.uid,
      email: res.user.email,
      displayName: res.user.displayName,
      role: "admin", // Ou client par défaut
      createdAt: new Date()
    });
  }
};

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, googleLogin }}>
      {!loading && children} 
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);