"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLostItems, Item, ClaimTicket } from '../../hooks/useLostItems';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const { items, addItem, editItem, resolveClaim, isLoaded } = useLostItems();
  const [activeTab, setActiveTab] = useState<'add'|'current'|'pending'|'history'>('current');
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  
  // Pending Modal States
  const [selectedPendingItem, setSelectedPendingItem] = useState<Item | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<ClaimTicket | null>(null);
  const [pendingAction, setPendingAction] = useState<'accept' | 'reject' | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');

  // Editing States
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const [processedCurrentItems, setProcessedCurrentItems] = useState<Item[]>([]);

  useEffect(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setCurrentTime(`${hh}:${mm}`);
  }, [activeTab]);

  useEffect(() => {
    const workerCode = `
      self.onmessage = function(e) {
        const { items, search, category } = e.data;
        const result = items.filter(item => {
          // Show both active AND pending items in inventory
          if (item.status === 'claimed') return false; 
          const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                                item.description.toLowerCase().includes(search.toLowerCase());
          const matchesCat = category ? item.category === category : true;
          return matchesSearch && matchesCat;
        });
        self.postMessage(result);
      }
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    workerRef.current = new Worker(URL.createObjectURL(blob));
    
    workerRef.current.onmessage = (e) => {
      setProcessedCurrentItems(e.data);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (workerRef.current && isLoaded) {
      workerRef.current.postMessage({ items, search: searchQuery, category: filterCat });
    }
  }, [items, searchQuery, filterCat, isLoaded]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid credentials');
    }
    setUsername('');
    setPassword('');
  };

  const handleConfirmPendingAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmPassword === 'admin123' && selectedPendingItem && selectedTicket && pendingAction) {
      resolveClaim(selectedPendingItem.id, pendingAction, 'Admin', selectedTicket.studentNumber);
      setSelectedPendingItem(null);
      setSelectedTicket(null);
      setPendingAction(null);
      setConfirmPassword('');
      alert(`Claim ${pendingAction === 'accept' ? 'confirmed' : 'rejected'} successfully!`);
    } else {
      alert('Incorrect Admin Password!');
      setConfirmPassword('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const compressedPhotos: string[] = [];
    
    for (const file of Array.from(e.target.files)) {
      const reader = new FileReader();
      const promise = new Promise<string>((resolve) => {
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.6)); 
          };
          img.src = event.target?.result as string;
        };
      });
      reader.readAsDataURL(file);
      compressedPhotos.push(await promise);
    }
    setPhotos(prev => [...prev, ...compressedPhotos]);
  };

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addItem({
      name: fd.get('name') as string,
      description: fd.get('description') as string,
      locationFound: fd.get('locationFound') as string,
      dateFound: fd.get('dateFound') as string,
      timeFound: fd.get('timeFound') as string,
      category: fd.get('category') as string,
      color: fd.get('color') as string,
      photos: photos
    });
    alert('Item added successfully!');
    e.currentTarget.reset();
    setPhotos([]);
    setActiveTab('current');
  };

  const handleEditItemSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    const fd = new FormData(e.currentTarget);
    editItem(editingItem.id, {
      name: fd.get('name') as string,
      description: fd.get('description') as string,
      locationFound: fd.get('locationFound') as string,
      dateFound: fd.get('dateFound') as string,
      timeFound: fd.get('timeFound') as string,
      category: fd.get('category') as string,
      color: fd.get('color') as string,
    });
    alert('Item updated successfully!');
    setEditingItem(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-red-700 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 sm:p-10 w-full max-w-sm rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Taguig City University: Lost & Found Portal</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Username</label>
              <input type="text" id="username" name="username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
              <input type="password" id="password" name="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white transition-all" />
            </div>
          </div>
          
          <button type="submit" className="w-full bg-red-700 text-white font-bold py-3.5 rounded-xl hover:bg-red-800 transition-colors shadow-md hover:shadow-lg mt-8">Sign In</button>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-500 font-medium hover:text-red-700 transition-colors flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Back to Public View
            </Link>
          </div>
        </form>
      </div>
    );
  }

  const pendingItems = items.filter(i => i.status === 'pending');
  const historyItems = items.filter(i => i.status === 'claimed');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar Panel */}
      <aside className="w-56 bg-red-800 flex flex-col shadow-lg z-10 text-white border-r border-red-900">
        <div className="p-6 border-b border-red-700">
          <h2 className="text-lg font-bold tracking-tight">Admin Dashboard</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <p className="text-xs text-red-200 font-medium">Admin Active</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button onClick={() => setActiveTab('add')} className={`w-full text-left p-3 rounded-xl transition-all font-medium flex items-center gap-3 ${activeTab === 'add' ? 'bg-white text-red-800 shadow-md' : 'hover:bg-red-700'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add Found Item
          </button>
          <button onClick={() => setActiveTab('current')} className={`w-full text-left p-3 rounded-xl transition-all font-medium flex items-center justify-between ${activeTab === 'current' ? 'bg-white text-red-800 shadow-md' : 'hover:bg-red-700'}`}>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              Inventory
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'current' ? 'bg-red-100 text-red-800' : 'bg-red-900 text-white'}`}>{items.filter(i=> i.status !== 'claimed').length}</span>
          </button>
          <button onClick={() => setActiveTab('pending')} className={`w-full text-left p-3 rounded-xl transition-all font-medium flex items-center justify-between ${activeTab === 'pending' ? 'bg-white text-red-800 shadow-md' : 'hover:bg-red-700'}`}>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Pending
            </div>
            {pendingItems.length > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900">{pendingItems.length}</span>}
          </button>
          <button onClick={() => setActiveTab('history')} className={`w-full text-left p-3 rounded-xl transition-all font-medium flex items-center gap-3 ${activeTab === 'history' ? 'bg-white text-red-800 shadow-md' : 'hover:bg-red-700'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            History
          </button>
        </nav>
        <div className="p-4 border-t border-red-700">
          <Link href="/" onClick={() => setIsAuthenticated(false)} className="flex items-center justify-center gap-2 w-full text-center bg-red-900 text-white font-medium p-3 rounded-xl hover:bg-black transition-colors shadow-inner">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
        
        {/* ADD ITEM TAB */}
        {activeTab === 'add' && (
          <div className="max-w-3xl bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Register New Found Item</h3>
            <form onSubmit={handleAddItem} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name</label>
                  <input required name="name" type="text" className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="e.g., ID Card, Tumbler" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea required name="description" className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" rows={4}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select required name="category" className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white">
                    <option value="">Select Category...</option>
                    <option value="electronics-phone">Mobile Phone</option>
                    <option value="electronics-laptop">Laptop / Tablet</option>
                    <option value="electronics-other">Other Electronics</option>
                    <option value="container-plastic">Plastic Tumbler</option>
                    <option value="container-metal">Metal Flask</option>
                    <option value="docs-id">School ID / License</option>
                    <option value="docs-notebook">Notebook / Book</option>
                    <option value="access-wallet">Wallet / Purse</option>
                    <option value="access-keys">Keys</option>
                    <option value="clothes-jacket">Jacket / Uniform</option>
                    <option value="other">Other / Misc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                  <select required name="color" className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white">
                    <option value="">Select Color...</option>
                    <optgroup label="Primary Colors">
                      <option value="red">Red</option>
                      <option value="yellow">Yellow</option>
                      <option value="blue">Blue</option>
                    </optgroup>
                    <optgroup label="Secondary Colors">
                      <option value="orange">Orange</option>
                      <option value="green">Green</option>
                      <option value="violet">Violet</option>
                    </optgroup>
                    <optgroup label="Tertiary Colors">
                      <option value="red-orange">Red-Orange</option>
                      <option value="yellow-orange">Yellow-Orange</option>
                      <option value="yellow-green">Yellow-Green</option>
                      <option value="blue-green">Blue-Green</option>
                      <option value="blue-violet">Blue-Violet</option>
                      <option value="red-violet">Red-Violet</option>
                    </optgroup>
                    <optgroup label="Neutrals & Others">
                      <option value="black">Black</option>
                      <option value="white">White</option>
                      <option value="gray">Gray</option>
                      <option value="brown">Brown</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                      <option value="multi">Multi-Color / Patterned</option>
                    </optgroup>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location Found</label>
                  <input required name="locationFound" type="text" className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date Found</label>
                  <input required name="dateFound" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 outline-none focus:ring-2 focus:ring-red-500 bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Time Found</label>
                  <input required name="timeFound" type="time" defaultValue={currentTime} className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 outline-none focus:ring-2 focus:ring-red-500 bg-white" />
                </div>
                <div className="col-span-1 md:col-span-2 border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50 text-center hover:bg-gray-100 transition-colors">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 cursor-pointer">Upload Photos</label>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:bg-white file:shadow-sm cursor-pointer mx-auto block" />
                  {photos.length > 0 && (
                    <div className="flex gap-3 mt-4 overflow-x-auto justify-center">
                      {photos.map((p, i) => <img key={i} src={p} alt="preview" className="h-20 w-20 object-cover rounded-xl shadow-sm" />)}
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full bg-red-700 text-white font-bold py-4 rounded-xl hover:bg-red-800 transition-colors shadow-md mt-6">Save Item to Inventory</button>
            </form>
          </div>
        )}

        {/* CURRENT ITEMS TAB (Inventory) */}
        {activeTab === 'current' && (
          <div className="max-w-4xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Active Inventory</h3>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <input type="text" placeholder="Search by name or description..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 focus:bg-white" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processedCurrentItems.map(item => (
                <div key={item.id} onClick={() => setEditingItem(item)} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden">
                  {item.status === 'pending' && (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                      Pending ({item.claims?.length || 0})
                    </div>
                  )}
                  {item.photos && item.photos[0] ? (
                    <img src={item.photos[0]} alt="" className="w-24 h-24 object-cover rounded-xl shadow-sm" />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-medium text-gray-400">No Image</div>
                  )}
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-bold text-lg text-gray-900 pr-12">{item.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">📍 {item.locationFound}</p>
                    <p className="text-sm text-gray-500">📅 {item.dateFound} ⏰ {item.timeFound}</p>
                    <p className="text-xs text-gray-400 mt-2">Click to Edit</p>
                  </div>
                </div>
              ))}
            </div>
            {processedCurrentItems.length === 0 && (
              <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center text-gray-500 font-medium">No items match your search.</div>
            )}
          </div>
        )}

        {/* PENDING CLAIMS TAB */}
        {activeTab === 'pending' && (
          <div className="max-w-4xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Pending Claims Verification</h3>
            <div className="space-y-6">
              {pendingItems.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    {item.photos && item.photos[0] ? (
                      <img src={item.photos[0]} alt="" className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-medium text-gray-400">No Image</div>
                    )}
                    <div>
                      <h4 className="font-bold text-xl text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">📍 {item.locationFound} | 📅 {item.dateFound}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h5 className="font-bold text-gray-700 text-sm mb-3">Submitted Claim Tickets</h5>
                    <div className="space-y-3">
                      {(item.claims || []).map(ticket => (
                        <div key={ticket.studentNumber} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                          <div>
                            <p className="font-bold text-gray-900">ID: {ticket.studentNumber}</p>
                            <p className="text-xs text-gray-500">Submitted: {ticket.claimTime}</p>
                          </div>
                          <button 
                            onClick={() => { setSelectedPendingItem(item); setSelectedTicket(ticket); }} 
                            className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            Review
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {pendingItems.length === 0 && (
              <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center text-gray-500 font-medium">No pending claim tickets at the moment.</div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="max-w-5xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Claim History</h3>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-medium">
                    <tr>
                      <th className="p-5">Item Name</th>
                      <th className="p-5">Claimed By (ID)</th>
                      <th className="p-5">Date Found</th>
                      <th className="p-5">Released By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {historyItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-5 font-bold text-gray-900">{item.name}</td>
                        <td className="p-5 text-gray-600 font-medium">{item.acceptedClaimer}</td>
                        <td className="p-5 text-gray-500">{item.dateFound}</td>
                        <td className="p-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            {item.processedByAdmin}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {historyItems.length === 0 && (
                      <tr><td colSpan={4} className="p-10 text-center text-gray-500 font-medium">No items have been released yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={() => setEditingItem(null)}></div>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="p-5 flex justify-between items-center border-b border-gray-100 sticky top-0 bg-white z-20">
              <h3 className="font-bold text-xl text-gray-900">Edit Inventory Item</h3>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleEditItemSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name</label>
                  <input required name="name" type="text" defaultValue={editingItem.name} className="w-full border rounded-xl p-3 text-gray-900 outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea required name="description" defaultValue={editingItem.description} className="w-full border rounded-xl p-3 text-gray-900 outline-none focus:border-red-500" rows={3}></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select required name="category" defaultValue={editingItem.category} className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 outline-none focus:ring-2 focus:ring-red-500 bg-white">
                      <option value="">Select Category...</option>
                      <option value="electronics-phone">Mobile Phone</option>
                      <option value="electronics-laptop">Laptop / Tablet</option>
                      <option value="electronics-other">Other Electronics</option>
                      <option value="container-plastic">Plastic Tumbler</option>
                      <option value="container-metal">Metal Flask</option>
                      <option value="docs-id">School ID / License</option>
                      <option value="docs-notebook">Notebook / Book</option>
                      <option value="access-wallet">Wallet / Purse</option>
                      <option value="access-keys">Keys</option>
                      <option value="clothes-jacket">Jacket / Uniform</option>
                      <option value="other">Other / Misc</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Color</label>
                    <select required name="color" defaultValue={editingItem.color} className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 outline-none focus:ring-2 focus:ring-red-500 bg-white">
                      <option value="">Select Color...</option>
                      <optgroup label="Primary Colors">
                        <option value="red">Red</option>
                        <option value="yellow">Yellow</option>
                        <option value="blue">Blue</option>
                      </optgroup>
                      <optgroup label="Secondary Colors">
                        <option value="orange">Orange</option>
                        <option value="green">Green</option>
                        <option value="violet">Violet</option>
                      </optgroup>
                      <optgroup label="Tertiary Colors">
                        <option value="red-orange">Red-Orange</option>
                        <option value="yellow-orange">Yellow-Orange</option>
                        <option value="yellow-green">Yellow-Green</option>
                        <option value="blue-green">Blue-Green</option>
                        <option value="blue-violet">Blue-Violet</option>
                        <option value="red-violet">Red-Violet</option>
                      </optgroup>
                      <optgroup label="Neutrals & Others">
                        <option value="black">Black</option>
                        <option value="white">White</option>
                        <option value="gray">Gray</option>
                        <option value="brown">Brown</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                        <option value="multi">Multi-Color / Patterned</option>
                      </optgroup>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Location Found</label>
                    <input required name="locationFound" type="text" defaultValue={editingItem.locationFound} className="w-full border rounded-xl p-3 text-gray-900 outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date Found</label>
                    <input required name="dateFound" type="date" defaultValue={editingItem.dateFound} className="w-full border rounded-xl p-3 text-gray-900 outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Time Found</label>
                    <input required name="timeFound" type="time" defaultValue={editingItem.timeFound} className="w-full border rounded-xl p-3 text-gray-900 outline-none focus:border-red-500" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-red-700 text-white font-bold py-3.5 rounded-xl hover:bg-red-800 mt-4">Save Changes</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PENDING CLAIM REVIEW MODAL (Specific Ticket) */}
      {selectedPendingItem && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={() => { setSelectedPendingItem(null); setSelectedTicket(null); setPendingAction(null); setConfirmPassword(''); }}></div>
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="p-5 flex justify-between items-center border-b border-gray-100">
              <h3 className="font-bold text-xl text-gray-900">Review Claim Ticket</h3>
              <button onClick={() => { setSelectedPendingItem(null); setSelectedTicket(null); setPendingAction(null); setConfirmPassword(''); }} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6">
              {!pendingAction ? (
                <>
                  <div className="text-center mb-6">
                    <h4 className="font-bold text-2xl text-gray-900 mb-2">{selectedPendingItem.name}</h4>
                    <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 font-medium px-4 py-2 rounded-xl text-sm mb-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
                      Student ID: <span className="font-bold text-gray-900 text-base">{selectedTicket.studentNumber}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button onClick={() => setPendingAction('accept')} className="flex-1 bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 shadow-sm transition-colors">Accept Claim</button>
                    <button onClick={() => setPendingAction('reject')} className="flex-1 bg-red-50 text-red-700 font-bold py-3.5 rounded-xl hover:bg-red-100 transition-colors">Reject Ticket</button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleConfirmPendingAction} className="space-y-4">
                  <div className={`p-4 rounded-2xl ${pendingAction === 'accept' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} mb-6 text-center`}>
                    <p className="font-medium text-sm">You are about to <span className="font-bold">{pendingAction === 'accept' ? 'RELEASE' : 'REJECT'}</span> this ticket for Student <b>{selectedTicket.studentNumber}</b>.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Password</label>
                    <input type="password" required autoFocus value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Password" className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 outline-none focus:border-red-500" />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => { setPendingAction(null); setConfirmPassword(''); }} className="w-1/3 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200">Cancel</button>
                    <button type="submit" className={`w-2/3 text-white font-bold py-3.5 rounded-xl ${pendingAction === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>Confirm {pendingAction}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}