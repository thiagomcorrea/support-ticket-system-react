
/* 
import { useState, createContext, useEffect } from 'react';
import firebase from '../services/firebaseConnection';
import { toast } from 'react-toastify';

export const AuthContext = createContext({});

function AuthProvider({ children }){
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{

    function loadStorage(){
      const storageUser = localStorage.getItem('SistemaUser');

      if(storageUser){
        setUser(JSON.parse(storageUser));
        setLoading(false);
      }
  
      setLoading(false);
    }
    
    loadStorage();

  }, [])


  //Fazendo login do usuario
  async function signIn(email, password){
    setLoadingAuth(true);

    await firebase.auth().signInWithEmailAndPassword(email, password)
    .then(async (value)=> {
      let uid = value.user.uid;

      const userProfile = await firebase.firestore().collection('users')
      .doc(uid).get();

      let data = {
        uid: uid,
        nome: userProfile.data().nome,
        avatarUrl: userProfile.data().avatarUrl,
        email: value.user.email
      };

      setUser(data);
      storageUser(data);
      setLoadingAuth(false);
      toast.success('Bem vindo de volta!');


    })
    .catch((error)=>{
      console.log(error);
      toast.error('Ops algo deu errado!');
      setLoadingAuth(false);
    })

  }


  //Cadastrando um novo usuario
  async function signUp(email, password, nome){
    setLoadingAuth(true);

    await firebase.auth().createUserWithEmailAndPassword(email, password)
    .then( async (value)=>{
      let uid = value.user.uid;

      await firebase.firestore().collection('users')
      .doc(uid).set({
        nome: nome,
        avatarUrl: null,
      })
      .then( () => {

        let data = {
          uid: uid,
          nome: nome,
          email: value.user.email,
          avatarUrl: null
        };

        setUser(data);
        storageUser(data);
        setLoadingAuth(false);
        toast.success('Bem vindo a plataforma!');

      })

    })
    .catch((error)=>{
      console.log(error);
      toast.error('Ops algo deu errado!');
      setLoadingAuth(false);
    })

  }



  function storageUser(data){
    localStorage.setItem('SistemaUser', JSON.stringify(data));
  }



  //Logout do usuario
  async function signOut(){
    await firebase.auth().signOut();
    localStorage.removeItem('SistemaUser');
    setUser(null);
  }


  return(
    <AuthContext.Provider 
    value={{ 
      signed: !!user,  
      user, 
      loading, 
      signUp,
      signOut,
      signIn,
      loadingAuth,
      setUser,
      storageUser
    }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider;
*/

import { useState, createContext, useEffect } from "react";
import firebase from "../services/firebaseConnection";
import { toast } from "react-toastify";

export const AuthContext = createContext({});

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const unsub = firebase.auth().onAuthStateChanged(async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      localStorage.removeItem("SistemaUser");
      setLoading(false);
      return;
    }

    const uid = firebaseUser.uid;

    // garante doc /users/{uid}
    const userRef = firebase.firestore().collection("users").doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      await userRef.set({
        nome: firebaseUser.email.split("@")[0],
        avatarUrl: null,
        createdAt: new Date(),
      });
    }

    const profile = (await userRef.get()).data();

    const data = {
      uid,
      nome: profile?.nome ?? "Sem nome",
      avatarUrl: profile?.avatarUrl ?? null,
      email: firebaseUser.email,
    };

    setUser(data);
    localStorage.setItem("SistemaUser", JSON.stringify(data));
    setLoading(false);
  });

  return () => unsub();
}, []);

  /*async function signIn(email, password) {
    setLoadingAuth(true);

    try {
      const value = await firebase.auth().signInWithEmailAndPassword(email, password);

      const uid = value.user.uid;
      const userProfile = await firebase.firestore().collection("users").doc(uid).get();

      // Evita crash se não existir doc no Firestore
      const profileData = userProfile.exists ? userProfile.data() : {};

      const data = {
        uid,
        nome: profileData?.nome ?? "Sem nome",
        avatarUrl: profileData?.avatarUrl ?? null,
        email: value.user.email,
      };

      setUser(data);
      localStorage.setItem("SistemaUser", JSON.stringify(data));
      toast.success("Welcome back 👋");
    } catch (error) {
      console.log(error);

      let message = "Unable to sign in. Please try again.";

      if (error.code === "auth/user-not-found") {
        message = "User not found.";
      }

      if (error.code === "auth/wrong-password") {
        message = "Incorrect password.";
      }

      if (error.code === "auth/invalid-email") {
        message = "Invalid email format.";
      }

      if (error.code === "auth/too-many-requests") {
        message = "Too many attempts. Try again later.";
      }

      toast.error(message);
    } finally {
      setLoadingAuth(false);
    }
  }*/

    async function signIn(email, password) {
    setLoadingAuth(true);

    try {
      const value = await firebase.auth().signInWithEmailAndPassword(email, password);

      const uid = value.user.uid;
      const userProfile = await firebase.firestore().collection("users").doc(uid).get();

      const profileData = userProfile.exists ? userProfile.data() : {};

      const data = {
        uid,
        nome: profileData?.nome ?? "Sem nome",
        avatarUrl: profileData?.avatarUrl ?? null,
        email: value.user.email,
      };

      setUser(data);
      localStorage.setItem("SistemaUser", JSON.stringify(data));
      toast.success("Welcome back 👋");
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      setLoadingAuth(false);
    }
  }

  async function signUp(email, password, nome) {
    setLoadingAuth(true);

    try {
      const value = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const uid = value.user.uid;

      await firebase.firestore().collection("users").doc(uid).set({
        nome,
        avatarUrl: null,
      });

      const data = { uid, nome, email: value.user.email, avatarUrl: null };
      setUser(data);
      localStorage.setItem("SistemaUser", JSON.stringify(data));
      toast.success("Account created successfully 🚀");
    } catch (error) {
      console.log(error);

      let message = "Unable to create account.";

      if (error.code === "auth/email-already-in-use") {
        message = "This email is already registered.";
      }

      if (error.code === "auth/invalid-email") {
        message = "Invalid email format.";
      }

      if (error.code === "auth/weak-password") {
        message = "Password must have at least 6 characters.";
      }

      toast.error(message);
    } finally {
      setLoadingAuth(false);
    }
  }

  async function signOut() {
    await firebase.auth().signOut();
    localStorage.removeItem("SistemaUser");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        loading,
        loadingAuth,
        signIn,
        signUp,
        signOut,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
