"use client";
import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, addDoc, updateDoc } from 'firebase/firestore';

export type ClaimTicket = {
  studentNumber: string;
  claimTime: string;
};

export type Item = {
  id: string;
  name: string;
  description: string;
  locationFound: string;
  dateFound: string;
  timeFound: string;
  category: string;
  color: string;
  photos: string[];
  status: 'active' | 'pending' | 'claimed';
  claims?: ClaimTicket[];
  acceptedClaimer?: string;
  processedByAdmin?: string;
};

// ------------------------------------------------------------------
// Firebase Cloud Initialization
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDuQFiJMF-AAyzDJN0QrJoAXXHoINNBDB8",
  authDomain: "quadcore023-uni-lost-and-found.firebaseapp.com",
  projectId: "quadcore023-uni-lost-and-found",
  storageBucket: "quadcore023-uni-lost-and-found.firebasestorage.app",
  messagingSenderId: "625547375042",
  appId: "1:625547375042:web:c73c56eb89cf847959e65b",
  measurementId: "G-NGQC6Y1GFX"
};

// Initialize Firebase securely
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ------------------------------------------------------------------
// Main Hook
// ------------------------------------------------------------------
export function useLostItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Real-time Cloud Sync Listener
  useEffect(() => {
    const itemsCollection = collection(db, 'lostItems');
    
    // onSnapshot listens to the database and instantly updates the UI when data changes
    const unsubscribe = onSnapshot(itemsCollection, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Item[];
      
      // Sort newest items to the top based on Date and Time found
      fetchedItems.sort((a, b) => Date.parse(b.dateFound + ' ' + b.timeFound) - Date.parse(a.dateFound + ' ' + a.timeFound));
      
      setItems(fetchedItems);
      setIsLoaded(true);
    }, (error) => {
      console.error("Firebase Sync Error:", error);
      setIsLoaded(true);
    });

    return () => unsubscribe(); // Cleanup listener when component unmounts
  }, []);

  const addItem = async (item: Omit<Item, 'id' | 'status'>) => {
    try {
      await addDoc(collection(db, 'lostItems'), {
        ...item,
        status: 'active',
        claims: []
      });
    } catch (error) {
      console.error("Error pushing item to cloud: ", error);
      alert("Failed to upload to cloud database.");
    }
  };

  const editItem = async (id: string, updatedData: Partial<Item>) => {
    try {
      const itemRef = doc(db, 'lostItems', id);
      await updateDoc(itemRef, updatedData);
    } catch (error) {
      console.error("Error updating cloud document: ", error);
    }
  };

  const requestClaim = async (id: string, studentNumber: string) => {
    const now = new Date();
    const timeString = now.toLocaleDateString() + ' @ ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;

    const newClaims = [...(targetItem.claims || []), { studentNumber, claimTime: timeString }];
    
    try {
      const itemRef = doc(db, 'lostItems', id);
      await updateDoc(itemRef, {
        status: 'pending',
        claims: newClaims
      });
    } catch (error) {
      console.error("Error submitting claim to cloud: ", error);
    }
  };

  const resolveClaim = async (id: string, action: 'accept' | 'reject', adminUsername: string, targetStudent: string) => {
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;

    try {
      const itemRef = doc(db, 'lostItems', id);
      
      if (action === 'accept') {
        await updateDoc(itemRef, {
          status: 'claimed',
          processedByAdmin: adminUsername,
          acceptedClaimer: targetStudent
        });
      } else {
        const remainingClaims = (targetItem.claims || []).filter(c => c.studentNumber !== targetStudent);
        await updateDoc(itemRef, {
          claims: remainingClaims,
          status: remainingClaims.length > 0 ? 'pending' : 'active'
        });
      }
    } catch (error) {
      console.error("Error resolving claim in cloud: ", error);
    }
  };

  return { items, addItem, editItem, requestClaim, resolveClaim, isLoaded };
}