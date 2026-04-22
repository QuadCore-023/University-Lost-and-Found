"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useLostItems, Item } from '../hooks/useLostItems';

const CATEGORY_TAGS = [
  { id: 'electronics', label: 'Electronics' },
  { id: 'container', label: 'Containers' },
  { id: 'docs', label: 'Documents' },
  { id: 'access', label: 'Accessories' },
  { id: 'clothes', label: 'Clothing' },
  { id: 'other', label: 'Other' }
];

const COLOR_TAGS = [
  { id: 'red', label: 'Red' }, { id: 'blue', label: 'Blue' }, { id: 'yellow', label: 'Yellow' },
  { id: 'green', label: 'Green' }, { id: 'black', label: 'Black' }, { id: 'white', label: 'White' },
  { id: 'gray', label: 'Gray' }, { id: 'brown', label: 'Brown' }, { id: 'silver', label: 'Silver' },
  { id: 'gold', label: 'Gold' }, { id: 'orange', label: 'Orange' }, { id: 'violet', label: 'Violet' }
];

export default function Home() {
  const { items, requestClaim, isLoaded } = useLostItems();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [studentNumber, setStudentNumber] = useState('');

  // Advanced Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [activeColors, setActiveColors] = useState<string[]>([]);

  if (!isLoaded) return <div className="p-8 text-center text-gray-500 h-screen flex items-center justify-center font-medium">Loading University Hub...</div>;

  // Filter items logic
  const displayItems = items.filter(item => item.status !== 'claimed');
  
  const filteredItems = displayItems.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(query) || 
                          item.description.toLowerCase().includes(query) ||
                          item.locationFound.toLowerCase().includes(query);
    
    const matchesCat = activeCategories.length === 0 || activeCategories.some(cat => item.category.includes(cat));
    const matchesColor = activeColors.length === 0 || activeColors.some(col => item.color.includes(col));
    
    return matchesSearch && matchesCat && matchesColor;
  });

  const claimedItems = items.filter(item => item.status === 'claimed').slice(0, 10);

  const toggleCategory = (id: string) => {
    setActiveCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleColor = (id: string) => {
    setActiveColors(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem && studentNumber.trim() !== '') {
      requestClaim(selectedItem.id, studentNumber);
      setSelectedItem(null);
      setStudentNumber('');
      alert('Claim ticket submitted! Please proceed to the admin office to verify your ID.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-red-700 text-white p-4 shadow-md sticky top-0 z-40 flex items-center justify-between rounded-b-2xl">
        <div className="w-16"></div>
        <h1 className="text-lg md:text-xl font-bold text-center flex-1 tracking-wide">University: Lost and Found</h1>
        <div className="flex space-x-3 w-16 justify-end">
          <button onClick={() => setShowHistory(true)} className="p-2 hover:bg-red-800 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </button>
          <Link href="/admin" className="p-2 hover:bg-red-800 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 pb-12">
        
        {/* ADVANCED FILTERING BUCKETS */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mt-2 mb-6 overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input 
                type="text" 
                placeholder="Search items, descriptions, or locations..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 focus:bg-white transition-all" 
              />
            </div>
          </div>

          <div className="p-5 flex flex-col lg:flex-row gap-6 bg-gray-50/50">
            {/* Active Filters Container (The target bucket) */}
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                Active Filters
              </h3>
              <div className={`min-h-[80px] p-4 rounded-2xl border-2 border-dashed transition-colors ${activeCategories.length > 0 || activeColors.length > 0 ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white'}`}>
                {activeCategories.length === 0 && activeColors.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center mt-2 italic">Click tags below to add them here</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {/* Render Active Category Tags */}
                    {activeCategories.map(catId => {
                      const tag = CATEGORY_TAGS.find(t => t.id === catId);
                      return tag ? (
                        <button key={`active-cat-${tag.id}`} onClick={() => toggleCategory(tag.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors shadow-sm animate-in zoom-in-95 duration-200">
                          {tag.label} <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      ) : null;
                    })}
                    {/* Render Active Color Tags */}
                    {activeColors.map(colId => {
                      const tag = COLOR_TAGS.find(t => t.id === colId);
                      return tag ? (
                        <button key={`active-col-${tag.id}`} onClick={() => toggleColor(tag.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors shadow-sm animate-in zoom-in-95 duration-200">
                          {tag.label} <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Available Tags Container */}
            <div className="flex-1 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">Available Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_TAGS.filter(tag => !activeCategories.includes(tag.id)).map(tag => (
                    <button key={`avail-cat-${tag.id}`} onClick={() => toggleCategory(tag.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 transition-all shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg> {tag.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">Available Colors</h3>
                <div className="flex flex-wrap gap-2">
                  {COLOR_TAGS.filter(tag => !activeColors.includes(tag.id)).map(tag => (
                    <button key={`avail-col-${tag.id}`} onClick={() => toggleColor(tag.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg> {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ITEM GRID */}
        {displayItems.length === 0 ? (
          <div className="text-center p-12 text-gray-500 font-medium mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
            No lost items are currently available to claim.
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center p-12 text-gray-500 font-medium mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
            No items match your active filters. Try removing some tags.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-2xl p-4 cursor-pointer shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden"
              >
                {item.photos && item.photos.length > 0 ? (
                  <img src={item.photos[0]} alt="Item" className="w-full h-36 object-cover rounded-xl mb-3" />
                ) : (
                  <div className="w-full h-36 bg-gray-100 flex items-center justify-center rounded-xl mb-3 text-gray-400 font-medium">No Image</div>
                )}
                <h3 className="font-bold text-gray-900 truncate text-lg">{item.name}</h3>
                <div className="text-xs text-gray-500 mt-2 flex-1 space-y-1">
                  <p className="truncate flex items-center gap-1"><span className="text-red-500">📍</span> {item.locationFound}</p>
                  <p className="flex items-center gap-1"><span className="text-blue-500">📅</span> {item.dateFound}</p>
                  <p className="flex items-center gap-1"><span className="text-green-500">⏰</span> {item.timeFound}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Item Details Modal - Fixed Transparent Blur Overlay */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 backdrop-blur-sm" 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={() => setSelectedItem(null)}
          ></div>
          
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="p-5 flex justify-between items-center border-b border-gray-100">
              <h3 className="font-bold text-xl text-gray-900 truncate">{selectedItem.name}</h3>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedItem.photos && selectedItem.photos.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                  {selectedItem.photos.map((photo, idx) => (
                    <img key={idx} src={photo} alt="Item" className="h-48 w-auto rounded-2xl object-cover snap-center shadow-sm" />
                  ))}
                </div>
              )}
              <div className="text-sm text-gray-700 space-y-3 font-medium bg-gray-50 p-4 rounded-2xl">
                <p><span className="text-gray-500 block text-xs">Description</span> {selectedItem.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <p><span className="text-gray-500 block text-xs">Category</span> <span className="capitalize">{selectedItem.category.replace('-', ' ')}</span></p>
                  <p><span className="text-gray-500 block text-xs">Color</span> <span className="capitalize">{selectedItem.color}</span></p>
                  <p><span className="text-gray-500 block text-xs">Location</span> {selectedItem.locationFound}</p>
                  <p><span className="text-gray-500 block text-xs">Date & Time</span> {selectedItem.dateFound} @ {selectedItem.timeFound}</p>
                </div>
              </div>
              
              <form onSubmit={handleClaim} className="mt-6 pt-4 border-t border-gray-100">
                <label className="block text-sm font-bold text-gray-900 mb-2">Claim this item</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Enter your Student Number" 
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 mb-4 text-gray-900 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                />
                <button type="submit" className="w-full bg-red-700 text-white font-bold py-3.5 rounded-xl hover:bg-red-800 transition-colors shadow-md hover:shadow-lg">
                  Submit Claim Ticket
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={() => setShowHistory(false)}></div>
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl flex flex-col max-h-[80vh] relative z-10 animate-in zoom-in-95 duration-200">
            <div className="p-5 flex justify-between items-center border-b border-gray-100">
              <h3 className="font-bold text-xl text-gray-900">Recently Claimed Items</h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3 bg-gray-50 rounded-b-3xl">
              {claimedItems.length > 0 ? (
                claimedItems.map(item => (
                  <div key={item.id} className="p-4 bg-white rounded-2xl shadow-sm text-sm text-gray-800 border border-gray-100">
                    <p className="font-bold text-lg mb-1">{item.name}</p>
                    <p className="text-gray-500">Found: {item.dateFound}</p>
                    <div className="flex items-center gap-2 mt-2 text-green-600 font-medium bg-green-50 w-max px-3 py-1 rounded-full text-xs">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Claimed Successfully
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 font-medium text-center py-8">No items claimed yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}