import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCVj56F7M39SanNMubjS4WslFx0Iiw9eGk",
  authDomain: "indri-ritual.firebaseapp.com",
  projectId: "indri-ritual",
  storageBucket: "indri-ritual.firebasestorage.app",
  messagingSenderId: "331486857",
  appId: "1:331486857:web:87465a9cc5f184018b1858"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);