"use client";
import { useState, useEffect } from 'react';

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
// IndexedDB Helper Functions
// ------------------------------------------------------------------
const DB_NAME = 'UniversityLostFoundDB';
const STORE_NAME = 'itemsStore';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Ensure this only runs in the browser, not on Next.js server
    if (typeof window === 'undefined') return reject("Server side");
    
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveToIndexedDB = async (items: Item[]) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(items, 'allItems');
  } catch (error) {
    console.error("IndexedDB Save Error:", error);
  }
};

const loadFromIndexedDB = async (): Promise<Item[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get('allItems');
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (error) {
    console.error("IndexedDB Load Error:", error);
    return [];
  }
};

// ------------------------------------------------------------------
// Main Hook
// ------------------------------------------------------------------
export function useLostItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const storedItems = await loadFromIndexedDB();
      setItems(storedItems);
      setIsLoaded(true);
    };
    loadData();
  }, []);

  const saveItems = (newItems: Item[]) => {
    setItems(newItems);
    saveToIndexedDB(newItems); // Using the massive capacity of IndexedDB
  };

  const addItem = (item: Omit<Item, 'id' | 'status'>) => {
    const newItem: Item = { ...item, id: Date.now().toString(), status: 'active', claims: [] };
    saveItems([newItem, ...items]);
  };

  const editItem = (id: string, updatedData: Partial<Item>) => {
    const updated = items.map(item => item.id === id ? { ...item, ...updatedData } : item);
    saveItems(updated);
  };

  const requestClaim = (id: string, studentNumber: string) => {
    const now = new Date();
    const timeString = now.toLocaleDateString() + ' @ ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const updated = items.map(item => {
      if (item.id === id) {
        const newClaims = [...(item.claims || []), { studentNumber, claimTime: timeString }];
        return { ...item, status: 'pending' as const, claims: newClaims };
      }
      return item;
    });
    saveItems(updated as Item[]);
  };

  const resolveClaim = (id: string, action: 'accept' | 'reject', adminUsername: string, targetStudent: string) => {
    const updated = items.map(item => {
      if (item.id === id) {
        if (action === 'accept') {
          return { ...item, status: 'claimed' as const, processedByAdmin: adminUsername, acceptedClaimer: targetStudent };
        } else {
          const remainingClaims = (item.claims || []).filter(c => c.studentNumber !== targetStudent);
          return {
            ...item,
            claims: remainingClaims,
            status: (remainingClaims.length > 0 ? 'pending' : 'active') as 'pending' | 'active'
          };
        }
      }
      return item;
    });
    saveItems(updated as Item[]);
  };

  return { items, addItem, editItem, requestClaim, resolveClaim, isLoaded };
}