import { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Wallet, 
  Package, 
  ShoppingBag,
  RotateCcw,
  LayoutGrid,
  X,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types & Globals ---

declare global {
  interface Window {
    updateGmodData: (name: string, money: number) => void;
    gmod?: {
      buyCase: (amount: number) => void;
      giveReward: (type: string, value: string) => void;
    };
  }
}

interface Case {
  id: string;
  name: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'mythic';
  image: string;
}

interface RewardItem {
  id?: string;
  type: 'money' | 'weapon' | 'implant';
  value: string;
  name: string;
  rarity: string;
  color: string;
}

interface InventoryItem extends RewardItem {
  id: string;
  status: 'inventory' | 'withdrawn';
}

// --- Icons & Images ---

const CASE_ICONS = {
  tactical: '/images/Tactical_loot_box_metal_render_202605122028-Photoroom.png',
  diplomat: '/images/Black_leather_diplomat_briefcase…_202605122025-Photoroom.png',
  evidence: '/images/Police_evidence_box_crime_scene_202605122022-Photoroom.png',
  ammo: '/images/Dark_green_ammo_can_icon_202605122020-Photoroom.png',
  lockbox: '/images/Grey_lockbox_with_brass_padlock_202605122017-Photoroom.png',
  wooden: '/images/Military_wooden_crate_metal_corners_202605122014-Photoroom.png',
  military: '/images/Military_loot_box_with_lock_202605122007-Photoroom.png',
};

// --- Pools & Data ---

const GMOD_CASE_PRICE = 1500;

const ITEM_POOL: RewardItem[] = [
  { type: 'money', value: '50000', name: '50,000$', rarity: 'epic', color: '#22c55e' },
  { type: 'weapon', value: 'weapon_pistol', name: 'Pistol', rarity: 'rare', color: '#3b82f6' },
  { type: 'implant', value: '1', name: 'Implant #1', rarity: 'mythic', color: '#ef4444' },
  { type: 'weapon', value: 'weapon_shotgun', name: 'Shotgun', rarity: 'epic', color: '#a855f7' },
  { type: 'implant', value: '2', name: 'Implant #2', rarity: 'mythic', color: '#ef4444' },
  { type: 'money', value: '10000', name: '10,000$', rarity: 'common', color: '#94a3b8' },
  { type: 'implant', value: '3', name: 'Implant #3', rarity: 'rare', color: '#3b82f6' },
  { type: 'weapon', value: 'weapon_smg', name: 'SMG-45', rarity: 'epic', color: '#a855f7' },
];

const MOCK_CASES: Case[] = [
  { id: '1', name: 'Tactical Supply', price: 1500, rarity: 'common', image: CASE_ICONS.tactical },
  { id: '2', name: 'Military Crate', price: 2500, rarity: 'rare', image: CASE_ICONS.military },
  { id: '3', name: 'Ammo Can', price: 500, rarity: 'common', image: CASE_ICONS.ammo },
  { id: '4', name: 'Diplomat Case', price: 5000, rarity: 'epic', image: CASE_ICONS.diplomat },
  { id: '5', name: 'Evidence Box', price: 1000, rarity: 'rare', image: CASE_ICONS.evidence },
  { id: '6', name: 'Wooden Treasure', price: 200, rarity: 'common', image: CASE_ICONS.wooden },
  { id: '7', name: 'Secret Lockbox', price: 10000, rarity: 'mythic', image: CASE_ICONS.lockbox },
];

// --- Sub-components ---

const Background = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[#0f0f12]" />
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-500/5 to-transparent" />
  </div>
);

const Sidebar = ({ activeTab, setTab, playerName }: { activeTab: string, setTab: (t: string) => void, playerName: string }) => (
  <aside className="w-72 hidden lg:flex flex-col border-r border-white/5 h-screen sticky top-0 bg-[#0a0a0c]/50 backdrop-blur-xl p-8 pt-12">
    <nav className="flex flex-col gap-3 flex-1">
      <button 
        onClick={() => setTab('cases')}
        className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all ${activeTab === 'cases' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
      >
        <ShoppingBag size={22} />
        <span className="font-black italic uppercase tracking-tight text-sm">Store</span>
      </button>
      <button 
        onClick={() => setTab('inventory')}
        className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all ${activeTab === 'inventory' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
      >
        <LayoutGrid size={22} />
        <span className="font-black italic uppercase tracking-tight text-sm">Inventory</span>
      </button>
      <div className="h-[1px] bg-white/5 my-6 mx-2" />
    </nav>

    <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-lg shadow-blue-600/20" />
        <div>
          <p className="text-xs font-black text-white italic uppercase tracking-widest truncate max-w-[140px]">{playerName}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">GMod Active</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
);

const RewardIcon = ({ type, color, size = 32 }: { type: string, color: string, size?: number }) => {
  if (type === 'money') return <Wallet size={size} style={{ color }} />;
  if (type === 'weapon') return <Zap size={size} style={{ color }} />;
  return <Package size={size} style={{ color }} />;
};

const CaseOpeningModal = ({ isOpen, caseItem, onClose, onWin }: { isOpen: boolean; caseItem: Case | null; onClose: () => void; onWin: (item: RewardItem) => void }) => {
  const [opening, setOpening] = useState(false);
  const [winner, setWinner] = useState<RewardItem | null>(null);
  const [items, setItems] = useState<RewardItem[]>([]);
  
  const generateItems = () => {
    return [...Array(60)].map((_, i) => {
      const randomItem = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
      return { ...randomItem, id: `spin-${i}` };
    });
  };

  useEffect(() => {
    if (isOpen && caseItem) {
      setItems(generateItems());
      setOpening(false);
      setWinner(null);
    }
  }, [isOpen, caseItem]);

  const startOpening = () => {
    if (opening) return;
    
    // Call Lua to check/buy
    if (window.gmod) {
        window.gmod.buyCase(caseItem?.price || GMOD_CASE_PRICE);
    }

    setOpening(true);
    const winningIndex = 52;
    
    setTimeout(() => {
      const wonItem = items[winningIndex];
      setWinner(wonItem);
      onWin(wonItem);
    }, 5100);
  };

  if (!isOpen || !caseItem) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`absolute inset-0 bg-black/90 ${opening && !winner ? '' : 'backdrop-blur-3xl'}`}
        onClick={!opening ? onClose : undefined}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl bg-[#0f0f12] border border-white/5 rounded-[48px] overflow-hidden"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={caseItem.image} alt={caseItem.name} className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">{caseItem.name}</h2>
              <p className="text-xs text-gray-500 font-medium">${caseItem.price} to open</p>
            </div>
          </div>
          <button 
            disabled={opening && !winner}
            onClick={onClose}
            className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all disabled:opacity-20"
          >
            <X size={24} />
          </button>
        </div>

        <div className="py-24 relative px-4 flex flex-col items-center">
          <div className="w-full relative h-[180px] overflow-hidden flex items-center select-none bg-black/40 rounded-3xl border border-white/5">
            <div className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-blue-500 z-20 ${opening && !winner ? '' : 'shadow-[0_0_20px_rgba(59,130,246,0.8)]'}`} />
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-[#0f0f12] via-transparent to-[#0f0f12]" />

            <motion.div 
              animate={opening ? { x: - (52 * 196) - 100 } : { x: 0 }}
              transition={{ duration: 5, ease: [0.15, 0, 0.05, 1] }} 
              className="flex gap-4 px-[50%]"
              style={{ width: 'max-content', willChange: 'transform' }}
            >
              {items.map((item, i) => (
                <div 
                  key={`${item.id}-${i}`} 
                  className="w-[180px] flex-shrink-0 h-[140px] bg-white/[0.03] rounded-2xl border border-white/5 flex flex-col items-center justify-center p-4 gap-3 transition-colors"
                >
                  <RewardIcon type={item.type} color={item.color} size={36} />
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-white uppercase line-clamp-1">{item.name}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>


          <AnimatePresence>
            {winner && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-16 text-center"
              >
                <div className="inline-block px-6 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                  YOU WON
                </div>
                <h3 className="text-5xl font-black italic tracking-tighter uppercase mb-6" style={{ color: winner.color }}>
                  {winner.name}
                </h3>
                <button 
                  onClick={onClose}
                  className="px-16 py-5 bg-white text-black font-black italic text-lg rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-xl"
                >
                  COLLECT
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!opening && (
            <motion.button 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              onClick={startOpening}
              className="mt-12 px-16 py-6 bg-blue-600 text-white font-black italic text-xl rounded-3xl shadow-[0_20px_60px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
            >
              <RotateCcw size={24} />
              OPEN CASE ${GMOD_CASE_PRICE}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('cases');
  const [balance, setBalance] = useState(0);
  const [playerName, setPlayerName] = useState('UNCONNECTED');
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('gmod_inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  useEffect(() => {
    window.updateGmodData = (name: string, money: number) => {
        setPlayerName(name);
        setBalance(money);
    };

    if (!window.gmod) {
        window.updateGmodData("TEST_PLAYER", 50000);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gmod_inventory', JSON.stringify(inventory));
  }, [inventory]);

  const handleWin = (item: RewardItem) => {
    if (!window.gmod && selectedCase) setBalance(prev => prev - selectedCase.price);
    const newItem: InventoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      status: 'inventory'
    };
    setInventory(prev => [newItem, ...prev]);
  };

  const handleWithdraw = (item: InventoryItem) => {
    // Notify GMod Lua
    if (window.gmod) {
      window.gmod.giveReward(item.type, item.value);
    }
    
    // Remove from web inventory and localStorage (handled by useEffect)
    setInventory(prev => prev.filter(i => i.id !== item.id));
    
    // Show local feedback if not in GMod
    if (!window.gmod) {
      alert(`Item ${item.name} successfully withdrawn to GMod!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white font-sans flex">
      <Background />
      <Sidebar activeTab={activeTab} setTab={setActiveTab} playerName={playerName} />

      <main className="flex-1 max-h-screen overflow-y-auto px-6 lg:px-12 py-12 relative">
        <div className="flex items-center justify-between mb-16">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2">
              {activeTab === 'cases' ? 'Black Market' : 'Inventory'}
            </h1>
          </div>

          <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-2 rounded-[32px] pr-10 backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Wallet className="text-white" size={28} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-0.5">Player Funds</p>
              <h3 className="text-2xl font-black font-mono tracking-tighter text-blue-400">
                ${balance.toLocaleString()}
              </h3>
            </div>
          </div>
        </div>

        {activeTab === 'cases' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-12">
            {MOCK_CASES.map((c) => (
              <div key={c.id} className="group relative p-12 rounded-[56px] bg-white/[0.04] border border-white/5 backdrop-blur-md transition-all hover:bg-white/[0.07] text-center border-b-4 border-b-blue-600">
                  <div className="relative mb-10">
                    <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full group-hover:bg-blue-500/30 transition-all opacity-0 group-hover:opacity-100" />
                    <img src={c.image} className="w-48 h-48 mx-auto relative drop-shadow-2xl group-hover:scale-105 transition-transform" alt={c.name} />
                  </div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">{c.name}</h3>
                  <button 
                      onClick={() => {
                        if (balance < c.price) return alert("Недостаточно денег!");
                        setSelectedCase(c);
                      }}
                      className="w-full py-5 bg-white text-black font-black italic rounded-2xl hover:bg-blue-600 hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                  >
                      OPEN FOR ${c.price}
                  </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            {inventory.length === 0 ? (
              <div className="col-span-full py-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[48px]">
                <Package size={64} className="text-white/10 mb-6" />
                <p className="text-gray-500 font-black italic uppercase tracking-widest text-sm">Your inventory is empty</p>
              </div>
            ) : (
              inventory.map((item) => (
                <div key={item.id} className="bg-white/5 border border-white/5 p-8 rounded-[40px] text-center group flex flex-col items-center overflow-hidden">
                    <div className="w-full aspect-square bg-black/20 rounded-3xl mb-6 flex items-center justify-center relative">
                        <div className="absolute inset-0 blur-2xl opacity-10" style={{ backgroundColor: item.color }} />
                        <RewardIcon type={item.type} color={item.color} size={64} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50" style={{ color: item.color }}>{item.rarity}</p>
                    <h4 className="text-base font-black text-white italic uppercase tracking-tighter mb-6 line-clamp-1">{item.name}</h4>
                    <button 
                      onClick={() => handleWithdraw(item)}
                      className="w-full py-4 bg-white/[0.07] border border-white/5 text-white font-black italic text-xs rounded-2xl hover:bg-white text-black transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={14} />
                      WITHDRAW
                    </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <AnimatePresence> 
        {selectedCase && (
          <CaseOpeningModal 
            isOpen={!!selectedCase} 
            caseItem={selectedCase} 
            onClose={() => setSelectedCase(null)} 
            onWin={handleWin}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
