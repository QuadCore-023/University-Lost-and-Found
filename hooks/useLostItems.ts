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

export function useLostItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('tcuLostItems');
    if (stored) {
      setItems(JSON.parse(stored));
    }
    setIsLoaded(true);
  }, []);

  const saveItems = (newItems: Item[]) => {
    try {
      setItems(newItems);
      localStorage.setItem('tcuLostItems', JSON.stringify(newItems));
    } catch (error) {
      console.error(error);
      alert("Storage Error: LocalStorage is full. Please delete some old items first.");
    }
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
        // Add the new claim ticket without removing previous ones
        const newClaims = [...(item.claims || []), { studentNumber, claimTime: timeString }];
        return { ...item, status: 'pending' as const, claims: newClaims };
      }
      return item;
    });
    // Explicitly cast to Item[] to satisfy strict TypeScript compilers
    saveItems(updated as Item[]);
  };

  const resolveClaim = (id: string, action: 'accept' | 'reject', adminUsername: string, targetStudent: string) => {
    const updated = items.map(item => {
      if (item.id === id) {
        if (action === 'accept') {
          return { ...item, status: 'claimed' as const, processedByAdmin: adminUsername, acceptedClaimer: targetStudent };
        } else {
          // Reject: Remove ONLY this specific student's ticket
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
    // Explicitly cast to Item[] to satisfy strict TypeScript compilers
    saveItems(updated as Item[]);
  };

  return { items, addItem, editItem, requestClaim, resolveClaim, isLoaded };
}