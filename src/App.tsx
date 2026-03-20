import React, { useState, useMemo, useEffect, Component } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor,
  TouchSensor,
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Search, Map as MapIcon, RotateCcw, Info, LogOut, LogIn, DoorOpen, Calculator, Plus, X, Save, ShieldCheck, User as UserIcon, Zap } from 'lucide-react';
import { INITIAL_ITEMS, INITIAL_LOCATIONS } from './constants';
import { Rack } from './components/Rack';
import { ItemCard } from './components/ItemCard';
import { SizeCalculator } from './components/SizeCalculator';
import { InventoryItem, StockRoomState } from './types';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  onSnapshot,
  User
} from './firebase';

// Error Handling Spec for Firestore Operations
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorInfo: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    const { children } = this.props;
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-red-100 max-w-lg w-full">
            <h2 className="text-2xl font-black text-red-600 mb-4">Something went wrong</h2>
            <p className="text-slate-600 mb-6">The application encountered an error. This might be due to missing permissions or a network issue.</p>
            <div className="bg-slate-50 p-4 rounded-xl font-mono text-xs overflow-auto max-h-48 mb-6">
              {this.state.errorInfo}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <StockRoomApp />
    </ErrorBoundary>
  );
}

function StockRoomApp() {
  const [state, setState] = useState<StockRoomState>(() => {
    const itemsMap: Record<string, InventoryItem> = {};
    INITIAL_ITEMS.forEach(item => {
      itemsMap[item.id] = item;
    });
    return {
      locations: INITIAL_LOCATIONS,
      items: itemsMap,
    };
  });

  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'calculator' | 'list'>('map');
  const [isAddingToLocation, setIsAddingToLocation] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ brand: '', codes: '', category: '' });
  const [clonedState, setClonedState] = useState<StockRoomState | null>(null);

  // Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Data Sync
  useEffect(() => {
    if (!isAuthReady) return;

    const path = 'stockRoom/current';
    const unsubscribe = onSnapshot(doc(db, 'stockRoom', 'current'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as StockRoomState;
        // Merge with initial locations to ensure new locations (like quick-grabs) exist
        const mergedLocations = { ...INITIAL_LOCATIONS };
        Object.keys(data.locations).forEach(key => {
          mergedLocations[key] = data.locations[key];
        });
        
        setState({
          ...data,
          locations: mergedLocations
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSaveToFirestore = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveStatus('idle');

    const path = 'stockRoom/current';
    try {
      await setDoc(doc(db, 'stockRoom', 'current'), {
        ...state,
        updatedAt: new Date(),
        updatedBy: user.uid
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = user?.email === 'bigaiagent@gmail.com';

  const handleAddItem = (locationId: string) => {
    setIsAddingToLocation(locationId);
  };

  const handleSaveNewItem = () => {
    if (!newItem.brand || !newItem.codes || !isAddingToLocation) return;

    const id = `item-${Date.now()}`;
    const item: InventoryItem = { id, ...newItem };

    setState(prev => ({
      ...prev,
      items: { ...prev.items, [id]: item },
      locations: {
        ...prev.locations,
        [isAddingToLocation]: {
          ...prev.locations[isAddingToLocation],
          items: [...prev.locations[isAddingToLocation].items, id]
        }
      }
    }));

    setIsAddingToLocation(null);
    setNewItem({ brand: '', codes: '', category: '' });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const highlightedItemId = useMemo(() => {
    if (!searchQuery) return null;
    let q = searchQuery.toLowerCase().trim();
    
    // Special handling for Journeys "00" prefix logic
    if (q.includes('00')) {
      const index = q.indexOf('00');
      const after00 = q.substring(index + 2);
      if (after00.length > 0) {
        q = after00.substring(0, 2);
      }
    }

    const items = Object.values(state.items) as InventoryItem[];

    // 1. Try exact/substring match on brand, codes string, or category
    const exactMatch = items.find(item => 
      item.brand.toLowerCase().includes(q) || 
      item.codes.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );

    if (exactMatch) return exactMatch.id;

    // 2. If no exact match and query is numeric, check ranges and proximity
    const searchNum = parseInt(q.replace(/\D/g, ''));
    if (!isNaN(searchNum) && q.length >= 2) {
      // Check for range matches first (e.g., "100 to 200")
      const rangeMatch = items.find(item => {
        const numbers = item.codes.match(/\d+/g)?.map(Number) || [];
        if (item.codes.toLowerCase().includes('to') && numbers.length >= 2) {
          // Find pairs of numbers that could be a range
          for (let i = 0; i < numbers.length - 1; i++) {
            const start = numbers[i];
            const end = numbers[i+1];
            if (start < end && searchNum >= start && searchNum <= end) return true;
          }
        }
        // Also check if it's just one of the numbers
        return numbers.includes(searchNum);
      });

      if (rangeMatch) return rangeMatch.id;

      // 3. If still no match, find the NEAREST item numerically
      let nearestItem: InventoryItem | null = null;
      let minDiff = Infinity;

      items.forEach(item => {
        const numbers = item.codes.match(/\d+/g)?.map(Number) || [];
        numbers.forEach(n => {
          const diff = Math.abs(n - searchNum);
          if (diff < minDiff) {
            minDiff = diff;
            nearestItem = item;
          }
        });
      });

      // Only return nearest if it's reasonably close (e.g., within 1000 units for stock codes)
      if (nearestItem && minDiff < 5000) {
        return (nearestItem as InventoryItem).id;
      }
    }

    return null;
  }, [searchQuery, state.items]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setClonedState(state);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId) || overId;

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setState((prev) => {
      const activeItems = [...prev.locations[activeContainer].items];
      const overItems = [...prev.locations[overContainer].items];

      const activeIndex = activeItems.indexOf(activeId);
      const overIndex = overItems.indexOf(overId);

      let newIndex;
      if (overId in prev.locations) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowLastItem = over && overIndex === overItems.length - 1;
        const modifier = isBelowLastItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return {
        ...prev,
        locations: {
          ...prev.locations,
          [activeContainer]: {
            ...prev.locations[activeContainer],
            items: activeItems.filter((item) => item !== activeId),
          },
          [overContainer]: {
            ...prev.locations[overContainer],
            items: [
              ...overItems.slice(0, newIndex),
              activeItems[activeIndex],
              ...overItems.slice(newIndex, overItems.length),
            ],
          },
        },
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      if (clonedState) {
        setState(clonedState);
      }
      setActiveId(null);
      setClonedState(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId) || overId;

    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      setActiveId(null);
      setClonedState(null);
      return;
    }

    const activeIndex = state.locations[activeContainer].items.indexOf(activeId);
    const overIndex = state.locations[overContainer].items.indexOf(overId);

    if (activeIndex !== overIndex) {
      setState((prev) => ({
        ...prev,
        locations: {
          ...prev.locations,
          [overContainer]: {
            ...prev.locations[overContainer],
            items: arrayMove(prev.locations[overContainer].items, activeIndex, overIndex),
          },
        },
      }));
    }

    setActiveId(null);
    setClonedState(null);
  };

  function findContainer(id: string) {
    if (id in state.locations) return id;
    return Object.keys(state.locations).find((key) => state.locations[key].items.includes(id));
  }

  const resetLayout = () => {
    if (window.confirm('Reset all items to their initial positions?')) {
      const itemsMap: Record<string, InventoryItem> = {};
      INITIAL_ITEMS.forEach(item => {
        itemsMap[item.id] = item;
      });
      setState({
        locations: INITIAL_LOCATIONS,
        items: itemsMap,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
            <MapIcon className="text-blue-600" />
            STOCK ROOM <span className="text-blue-600">LOCATOR</span>
          </h1>
          <p className="text-slate-500 font-medium">Journeys Inventory Management System</p>
        </div>

        <div className="flex items-center gap-4">
        {/* Auth Section */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            {user ? (
              <div className="flex items-center gap-3 pr-2">
                <div className="flex items-center gap-2 pl-3 py-1.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'User'} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={16} />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[10px] font-black uppercase tracking-tight leading-none text-slate-900">{user.displayName?.split(' ')[0]}</p>
                    {isAdmin && <span className="text-[8px] font-black uppercase text-blue-600 flex items-center gap-0.5"><ShieldCheck size={8} /> Admin</span>}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-blue-600 transition-all"
              >
                <LogIn size={16} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>

          {/* Save Button (Admin Only) */}
          {isAdmin && (
            <button
              onClick={handleSaveToFirestore}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all shadow-lg ${
                saveStatus === 'success' 
                  ? 'bg-emerald-500 text-white shadow-emerald-100' 
                  : saveStatus === 'error'
                  ? 'bg-red-500 text-white shadow-red-100'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
              } disabled:opacity-50`}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saveStatus === 'success' ? (
                <ShieldCheck size={16} />
              ) : (
                <Save size={16} />
              )}
              <span className="hidden sm:inline">{saveStatus === 'success' ? 'Saved' : saveStatus === 'error' ? 'Error' : 'Save Layout'}</span>
              <span className="sm:hidden">{saveStatus === 'success' ? '✓' : saveStatus === 'error' ? '!' : 'Save'}</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setView('map')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${view === 'map' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Map
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${view === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('calculator')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${view === 'calculator' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Calc
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full sm:w-48 lg:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm"
              />
            </div>
            <button 
              onClick={resetLayout}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm shrink-0"
              title="Reset Layout"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto pb-20">
        {view === 'calculator' ? (
          <SizeCalculator />
        ) : view === 'list' ? (
          <div className="grid gap-6">
            {Object.entries(state.locations).map(([id, location]) => (
              <div key={id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">{location.name}</h2>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    {location.items.length} Items
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {location.items.map(itemId => {
                    const item = state.items[itemId];
                    if (!item) return null;
                    return (
                      <div 
                        key={itemId}
                        className={`p-4 rounded-2xl border transition-all ${itemId === highlightedItemId ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-100' : 'bg-slate-50 border-slate-100'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-black text-slate-900">{item.brand}</span>
                          <span className="text-[9px] font-bold uppercase text-slate-400">{item.category}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">{item.codes}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {/* Quick Grabs Section */}
            {state.locations['quick-grabs'] && (
              <div className="max-w-7xl mx-auto mb-8">
                <div className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-[2rem] p-4 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500 rounded-lg text-white shadow-lg shadow-amber-200">
                        <Zap size={18} fill="currentColor" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-tight text-amber-900">Quick Grabs</h2>
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-600/70">Temporary staging area</p>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                      {state.locations['quick-grabs'].items.length} Items
                    </div>
                  </div>
                  <Rack 
                    location={state.locations['quick-grabs']} 
                    items={state.locations['quick-grabs'].items.map(id => state.items[id]).filter(Boolean)}
                    highlightedItemId={highlightedItemId}
                    onAddItem={handleAddItem}
                    columns={window.innerWidth < 640 ? 2 : 6}
                  />
                </div>
              </div>
            )}

            <div className="relative bg-white border border-slate-200 rounded-3xl shadow-xl p-4 sm:p-6 md:p-10 overflow-x-auto">
              {/* Room Boundary & Labels */}
              <div className="min-w-[1000px] relative h-[800px] border-4 border-slate-900 rounded-2xl p-8">
                
                {/* Top Row: Fire Exit & Washroom */}
                <div className="absolute -top-1 left-12 px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-b-lg flex items-center gap-2">
                  <DoorOpen size={14} /> FIRE EXIT
                </div>
                <div className="absolute -top-1 right-12 px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-b-lg">
                  WASHROOM
                </div>

                {/* Floor Layout Grid */}
                <div className="grid grid-cols-12 h-full gap-6">
                  
                  {/* Left Wall (Wall 2) */}
                  <div className="col-span-2 flex flex-col gap-4">
                    {state.locations['wall-2'] && (
                      <Rack 
                        location={state.locations['wall-2']} 
                        items={state.locations['wall-2'].items.map(id => state.items[id]).filter(Boolean)}
                        highlightedItemId={highlightedItemId}
                        onAddItem={handleAddItem}
                      />
                    )}
                  </div>

                  {/* Vertical Stands (Middle) */}
                  <div className="col-span-8 grid grid-cols-5 gap-4 px-4">
                    {['stand-1', 'stand-2', 'stand-3', 'stand-4', 'stand-5'].map(id => 
                      state.locations[id] ? (
                        <Rack 
                          key={id}
                          location={state.locations[id]} 
                          items={state.locations[id].items.map(itemId => state.items[itemId]).filter(Boolean)}
                          highlightedItemId={highlightedItemId}
                          onAddItem={handleAddItem}
                        />
                      ) : null
                    )}
                  </div>

                  {/* Right Side (Kids Section) */}
                  <div className="col-span-2 flex flex-col">
                    {state.locations['kids-section'] && (
                      <Rack 
                        location={state.locations['kids-section']} 
                        items={state.locations['kids-section'].items.map(id => state.items[id]).filter(Boolean)}
                        highlightedItemId={highlightedItemId}
                        onAddItem={handleAddItem}
                      />
                    )}
                  </div>

                  {/* Bottom Wall (Wall 1 + Exit + Toddlers) */}
                  <div className="col-span-12 mt-auto pt-8 border-t-2 border-slate-100 flex items-end gap-6 relative">
                    {/* Enter Indicator */}
                    <div className="absolute -top-10 left-0 flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100 border-2 border-white">
                        <LogIn size={20} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Entry</span>
                    </div>

                    <div className="flex-[3]">
                      {state.locations['wall-1'] && (
                        <Rack 
                          location={state.locations['wall-1']} 
                          items={state.locations['wall-1'].items.map(id => state.items[id]).filter(Boolean)}
                          highlightedItemId={highlightedItemId}
                          columns={2}
                          onAddItem={handleAddItem}
                        />
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-2 pb-2">
                      <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200 border-4 border-white">
                        <LogOut size={28} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">Exit</span>
                    </div>

                    <div className="flex-1">
                      {state.locations['toddlers'] && (
                        <Rack 
                          location={state.locations['toddlers']} 
                          items={state.locations['toddlers'].items.map(id => state.items[id]).filter(Boolean)}
                          highlightedItemId={highlightedItemId}
                          onAddItem={handleAddItem}
                        />
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}>
              {activeId ? (
                <div className="w-48 shadow-2xl rotate-3 scale-110 pointer-events-none">
                  <ItemCard item={state.items[activeId]} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {/* Glossary / Legend */}
      <footer className="max-w-7xl mx-auto mt-12 bg-white border-2 border-slate-900 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-100 pb-4">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <Info size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">
              Quick Reference <span className="text-blue-600">Glossary</span>
            </h2>
            <p className="text-slate-500 text-xs font-medium">Brand to Prefix Mapping (from stock room blueprint)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { c: '35', b: 'DC / TOMS' },
            { c: '36', b: 'Puma' },
            { c: '389/398', b: 'Converse' },
            { c: '397', b: 'A6 (Asics)' },
            { c: '40', b: 'New Balance' },
            { c: '437', b: 'Adidas' },
            { c: '496/497', b: 'Vans' },
            { c: '48', b: 'Reebok / Saucony' },
            { c: '52', b: 'Crocs' },
            { c: '53', b: 'Timberland' },
            { c: '57', b: 'Dr Martens' },
            { c: '58', b: 'Uggs' },
            { c: '85', b: 'Birkenstock' },
            { c: '89', b: 'Mens Uggs' },
          ].map(item => (
            <div key={item.c} className="group hover:border-blue-500 transition-all bg-slate-50 p-4 rounded-2xl border-2 border-transparent">
              <div className="text-blue-600 font-black text-2xl leading-none mb-2 group-hover:scale-110 transition-transform origin-left">{item.c}</div>
              <div className="text-slate-900 text-[11px] font-black uppercase tracking-tight leading-tight">{item.b}</div>
            </div>
          ))}
        </div>
      </footer>
      {/* Add Item Modal */}
      {isAddingToLocation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <Plus size={20} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">New Entry</h2>
              </div>
              <button 
                onClick={() => setIsAddingToLocation(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Brand Name</label>
                <input 
                  type="text" 
                  value={newItem.brand}
                  onChange={e => setNewItem(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="e.g. Nike, Vans..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Box Codes</label>
                <input 
                  type="text" 
                  value={newItem.codes}
                  onChange={e => setNewItem(prev => ({ ...prev, codes: e.target.value }))}
                  placeholder="e.g. 389400 to 389500"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Category Prefix</label>
                <input 
                  type="text" 
                  value={newItem.category}
                  onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g. 389"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              
              <button 
                onClick={handleSaveNewItem}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all mt-4"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
