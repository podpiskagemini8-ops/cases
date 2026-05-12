/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Wallet, 
  Package, 
  ShoppingBag,
  History,
  Info,
  Settings,
  ChevronRight,
  Search,
  LayoutGrid,
  Filter,
  X,
  Zap,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Global Types for GMod Integration ---
declare global {
  interface Window {
    updateGmodData: (name: string, money: number) => void;
    gmod?: {
      buyCase: (amount: number) => void;
      giveReward: (type: string, value: string) => void;
    };
  }
}

// --- Types ---

interface Case {
  id: string;
  name: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'mythic';
  image: string;
}

interface InventoryItem {
  id: string;
  name: string;
  type: 'money' | 'weapon' | 'implant';
  value: string;
  rarity: string;
  color: string;
  image?: string;
  status?: 'inventory' | 'withdrawn';
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

const MOCK_CASES: Case[] = [
  { id: '1', name: 'Cyberpunk Case', price: 1500, rarity: 'epic', image: CASE_ICONS.tactical },
  { id: '2', name: 'Standard Stash', price: 500, rarity: 'rare', image: CASE_ICONS.lockbox },
  { id: '3', name: 'Black Market', price: 3000, rarity: 'mythic', image: CASE_ICONS.diplomat },
];

const ITEM_POOL: Omit<InventoryItem, 'id'>[] = [
  { name: '$50,000', type: 'money', value: '50000', rarity: 'mythic', color: '#eab308' },
  { name: '$100,000', type: 'money', value: '100000', rarity: 'mythic', color: '#eab308' },
  { name: '$5,000', type: 'money', value: '5000', rarity: 'common', color: '#94a3b8' },
  
  { name: 'Pistol', type: 'weapon', value: 'weapon_pistol', rarity: 'common', color: '#94a3b8' },
  { name: 'Shotgun', type: 'weapon', value: 'weapon_shotgun', rarity: 'rare', color: '#a855f7' },
  { name: 'SMG', type: 'weapon', value: 'weapon_smg1', rarity: 'rare', color: '#a855f7' },
  { name: 'AR2', type: 'weapon', value: 'weapon_ar2', rarity: 'epic', color: '#ec4899' },
  { name: 'Crossbow', type: 'weapon', value: 'weapon_crossbow', rarity: 'epic', color: '#ec4899' },

  { name: 'Имплант Здоровья (Tier 1)', type: 'implant', value: '1', rarity: 'rare', color: '#a855f7' },
  { name: 'Имплант Скорости (Tier 2)', type: 'implant', value: '2', rarity: 'epic', color: '#ec4899' },
  { name: 'Имплант Брони (Tier 3)', type: 'implant', value: '3', rarity: 'mythic', color: '#eab308' },
  { name: 'Нейро-имплант (Tier 4)', type: 'implant', value: '4', rarity: 'mythic', color: '#ef4444' },
];

// --- Sub-components ---

const Background = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[#0f0f12]" />
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-600/10 to-transparent" />
    <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-purple-900/10 blur-[120px] rounded-full" />
  </div>
);

const Sidebar = ({ activeTab, setTab, playerName }: { activeTab: string, setTab: (t: string) => void, playerName: string }) => (
  <aside className="w-72 hidden lg:flex flex-col border-r border-white/5 h-screen sticky top-0 bg-[#0a0a0c]/50 backdrop-blur-xl p-8 pt-12">
    <nav className="flex flex-col gap-3 flex-1">
      <button 
        onClick={() => setTab('cases')}
        className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all ${activeTab === 'cases' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.05)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
      >
        <ShoppingBag size={22} />
        <span className="font-black italic uppercase tracking-tight text-sm">Магазин</span>
      </button>
      <button 
        onClick={() => setTab('inventory')}
        className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all ${activeTab === 'inventory' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.05)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
      >
        <LayoutGrid size={22} />
        <span className="font-black italic uppercase tracking-tight text-sm">Инвентарь</span>
      </button>

      <div className="h-[1px] bg-white/5 my-6 mx-2" />
    </nav>

    <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 shadow-lg shadow-purple-600/20 flex items-center justify-center">
          <User size={20} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-black text-white italic uppercase tracking-widest truncate max-w-[120px]">{playerName}</p>
        </div>
      </div>
    </div>
  </aside>
);

const CaseCard = ({ caseItem, onUnbox, onPreview }: { caseItem: Case; onUnbox: (c: Case) => void; onPreview: (c: Case) => void }) => {
  const getRarityColor = (rarity: Case['rarity']) => {
    switch (rarity) {
      case 'common': return 'slate';
      case 'rare': return 'purple';
      case 'epic': return 'pink';
      case 'mythic': return 'red';
      default: return 'purple';
    }
  };

  const color = getRarityColor(caseItem.rarity);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-purple-600/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative p-8 rounded-[40px] bg-white/5 border border-white/5 backdrop-blur-md overflow-hidden transition-all group-hover:border-purple-500/30 group-hover:bg-white/[0.07]">
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-8 relative">
            <motion.img 
              whileHover={{ rotate: 10, scale: 1.1 }}
              src={caseItem.image} 
              alt={caseItem.name} 
              className="w-32 h-32 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" 
              referrerPolicy="no-referrer"
            />
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 blur-lg bg-${color}-500 opacity-50`} />
          </div>
          
          <div className="text-center mb-6">
            <h3 className="text-lg font-black tracking-tight text-white mb-1 uppercase italic tracking-tighter">{caseItem.name}</h3>
            <p className="text-sm font-bold text-purple-400">${caseItem.price.toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button 
              onClick={() => onUnbox(caseItem)}
              className="py-4 bg-white text-black font-black italic text-[11px] rounded-2xl flex items-center justify-center gap-2 hover:bg-purple-600 hover:text-white transition-all shadow-xl shadow-black/20"
            >
              <span>ОТКРЫТЬ</span>
              <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => onPreview(caseItem)}
              className="py-4 bg-white/5 border border-white/10 text-white font-black italic text-[11px] rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
            >
              <Search size={14} />
              <span>ПРЕДМЕТЫ</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const InventoryItemCard = ({ item, onWithdraw }: { item: InventoryItem; onWithdraw: (id: string) => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="group bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.08] transition-all relative overflow-hidden"
  >
    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="w-full aspect-square bg-[#0a0a0c]/50 rounded-2xl mb-4 flex items-center justify-center p-6 transition-all duration-500">
      <Package size={48} style={{ color: item.color }} className="drop-shadow-lg" />
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-50" style={{ color: item.color }}>{item.rarity}</p>
      <h4 className="text-sm font-bold text-white leading-tight mb-4">{item.name}</h4>
      
      <button 
        onClick={() => onWithdraw(item.id)}
        className="w-full py-2.5 bg-purple-600/20 text-purple-400 font-bold text-[10px] rounded-xl border border-purple-500/30 uppercase tracking-[0.2em] hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-2"
      >
        <ExternalLink size={12} />
        <span>ЗАБРАТЬ</span>
      </button>
    </div>
  </motion.div>
);

const CasePreviewModal = ({ isOpen, caseItem, onClose }: { isOpen: boolean; caseItem: Case | null; onClose: () => void }) => {
  if (!isOpen || !caseItem) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-4xl bg-[#0f0f12] border border-white/5 rounded-[48px] overflow-hidden"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={caseItem.image} alt={caseItem.name} className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">Содержимое кейса</h2>
              <p className="text-xs text-gray-500 font-medium">Предметы, которые могут выпасть</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>
        <div className="p-10 grid grid-cols-2 md:grid-cols-5 gap-6 max-h-[60vh] overflow-y-auto">
          {ITEM_POOL.map((item, i) => (
            <div key={i} className="group bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.08] transition-all text-center">
              <div className="w-full aspect-square bg-[#0a0a0c]/50 rounded-2xl mb-4 flex items-center justify-center p-4">
                <Package size={32} style={{ color: item.color }} className="opacity-60" />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: item.color }}>{item.rarity}</p>
              <h4 className="text-[11px] font-bold text-white line-clamp-2">{item.name}</h4>
            </div>
          ))}
        </div>
        <div className="p-8 bg-black/40 border-t border-white/5 flex justify-center">
          <button onClick={onClose} className="px-12 py-4 bg-white text-black font-black italic rounded-2xl hover:bg-gray-200 transition-all">
            ВЕРНУТЬСЯ
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const CaseOpeningModal = ({ isOpen, caseItem, onClose, onWin }: { isOpen: boolean; caseItem: Case | null; onClose: () => void; onWin: (item: any) => void }) => {
  const [opening, setOpening] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const [finalX, setFinalX] = useState(0);

  // Constants for slider math
  const ITEM_WIDTH = 200;
  const GAP = 16;
  const FULL_WIDTH = ITEM_WIDTH + GAP;
  const WINNING_INDEX = 40;
  
  const generateItems = () => {
    return [...Array(55)].map((_, i) => {
      const randomItem = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
      return { ...randomItem, id: `opening-${i}` };
    });
  };

  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && caseItem) {
      setItems(generateItems());
      setOpening(false);
      setWinner(null);
      setFinalX(0);
    }
  }, [isOpen, caseItem]);

  const startOpening = () => {
    if (opening) return;
    setOpening(true);
    
    const offset = WINNING_INDEX * FULL_WIDTH;
    // Randomize stopping point within the winning item's width (avoiding exact edges)
    const randomize = Math.floor(Math.random() * (ITEM_WIDTH - 20)) - (ITEM_WIDTH / 2 - 10); 
    setFinalX(-(offset + randomize));

    setTimeout(() => {
      setWinner(items[WINNING_INDEX]);
      onWin(items[WINNING_INDEX]);
    }, 6000);
  };

  if (!isOpen || !caseItem) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
        onClick={!opening ? onClose : undefined}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-[#0f0f12] border border-white/5 rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={caseItem.image} alt={caseItem.name} className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">{caseItem.name}</h2>
              <p className="text-xs text-gray-500 font-medium">Уникальные предметы и импланты</p>
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

        <div className="py-20 relative px-4 flex flex-col items-center">
          <div className="w-full relative h-[250px] overflow-hidden flex items-center select-none bg-black/20 rounded-3xl border border-white/5 shadow-inner">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-purple-500 z-20 shadow-[0_0_20px_rgba(168,85,247,0.9)]" />
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-[#0f0f12] via-transparent to-[#0f0f12]" />

            <motion.div 
              animate={{ x: finalX }}
              transition={{ duration: 6, ease: [0.15, 1, 0.2, 1] }} // smooth realistic easing
              className="flex gap-4 px-[50vw]"
            >
              {items.map((item, i) => (
                <div 
                  key={item.id} 
                  className="w-[200px] flex-shrink-0 aspect-square bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center justify-center p-6 gap-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Package size={32} style={{ color: item.color }} className="opacity-50" />
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: item.color }}>{item.rarity}</p>
                    <h4 className="text-[10px] font-bold text-white line-clamp-1">{item.name}</h4>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <AnimatePresence>
            {winner && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 text-center"
              >
                <h3 className="text-4xl font-black italic tracking-tighter uppercase mb-4 mt-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" style={{ color: winner.color }}>
                  Вы выиграли:<br/>{winner.name}
                </h3>
                <div className="flex gap-4 justify-center mt-8">
                   <button 
                    onClick={onClose}
                    className="px-12 py-4 bg-white text-black font-black italic rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 shadow-2xl shadow-white/5"
                  >
                    ЗАБРАТЬ ПРИЗ
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!opening && !winner && (
            <motion.button 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              onClick={startOpening}
              className="mt-12 px-12 py-5 bg-blue-600 text-white font-black italic text-xl rounded-[24px] shadow-[0_20px_50px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:scale-105 transition-all flex items-center gap-4"
              className="mt-12 px-12 py-5 bg-purple-600 text-white font-black italic text-xl rounded-[24px] shadow-[0_20px_50px_rgba(168,85,247,0.4)] hover:bg-purple-500 hover:scale-105 transition-all flex items-center gap-4"
            >
              <Zap className="fill-white" size={24} />
              КРУТИТЬ КЕЙС
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('cases');
  const [playerName, setPlayerName] = useState('Загрузка...');
  const [balance, setBalance] = useState(25000);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [previewCase, setPreviewCase] = useState<Case | null>(null);

  // Setup GMod Global Integrations
  useEffect(() => {
    window.updateGmodData = (name: string, money: number) => {
      setPlayerName(name);
      setBalance(money);
    };

    // For local browser testing mock
    if (!window.gmod) {
      window.updateGmodData("TEST_PLAYER_77", 50000);
    }
  }, []);

  const handleUnbox = (c: Case) => {
    if (balance < c.price) {
      alert('Недостаточно средств!');
      return;
    }

    // GMod Payment Hook
    if (window.gmod && window.gmod.buyCase) {
      window.gmod.buyCase(c.price);
    } else {
      // Fallback for browser testing
      setBalance(prev => prev - c.price);
    }

    setSelectedCase(c);
  };

  const handleWin = (item: any) => {
    // GMod Give Reward Hook
    if (window.gmod && window.gmod.giveReward) {
      window.gmod.giveReward(item.type, String(item.value));
    }

    // Save to local inventory for visual feedback
    const newItem: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: item.name,
      type: item.type,
      value: item.value,
      rarity: item.rarity,
      color: item.color,
      status: 'inventory'
    };
    setInventory(prev => [newItem, ...prev]);
  };

  const handleWithdraw = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white font-sans selection:bg-purple-500/30 flex">
      <Background />
      <Sidebar activeTab={activeTab} setTab={setActiveTab} playerName={playerName} />

      <main className="flex-1 max-h-screen overflow-y-auto px-6 lg:px-12 py-8 relative">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-end mb-8">
          <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <User size={20} className="text-purple-400" />
          </div>
        </header>

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-1">
              {activeTab === 'cases' ? 'Магазин Кейсов' : 'Мой Инвентарь'}
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-4 bg-white/5 border border-white/5 p-2 rounded-2xl pr-6 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
              <Wallet className="text-white" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Ваш Баланс</p>
              <h3 className="text-xl font-bold font-mono tracking-tight">${balance.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* Filters & Tools */}
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input 
              type="text" 
              placeholder="Поиск предметов..." 
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2 text-gray-400">
              <Filter size={18} />
              <span className="text-sm font-bold">Фильтры</span>
            </button>
            <button className="px-6 py-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2 text-gray-400">
              <LayoutGrid size={18} />
              <span className="text-sm font-bold">Сетка</span>
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <AnimatePresence mode="wait">
          {activeTab === 'cases' ? (
            <motion.div 
              key="cases"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-32"
            >
              {MOCK_CASES.map((c) => (
                <div key={c.id}>
                  <CaseCard caseItem={c} onUnbox={handleUnbox} onPreview={setPreviewCase} />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="inventory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-32"
            >
              {inventory.map((item) => (
                <div key={item.id}>
                  <InventoryItemCard item={item} onWithdraw={handleWithdraw} />
                </div>
              ))}
              {/* Empty Slots */}
              {[...Array(Math.max(0, 12 - inventory.length))].map((_, i) => (
                <div key={i} className="aspect-square bg-white/[0.02] border border-dashed border-white/5 rounded-3xl" />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Footer (Visible when scrolling) */}
        <footer className="mt-auto py-12 border-t border-white/5 opacity-20 flex flex-col md:flex-row items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest tracking-tighter italic text-gray-400">GMOD DASHBOARD 2026</p>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] mt-4 md:mt-0 text-gray-400">
            <a href="#">Security</a>
            <a href="#">API Protocol</a>
            <a href="#">Terms of Use</a>
          </div>
        </footer>
      </main>

      {/* Case Opening Modal */}
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

      {/* Case Preview Modal */}
      <AnimatePresence> 
        {previewCase && (
          <CasePreviewModal 
            isOpen={!!previewCase} 
            caseItem={previewCase} 
            onClose={() => setPreviewCase(null)} 
          />
        )}
      </AnimatePresence>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden px-6 py-4 bg-[#0a0a0c]/80 backdrop-blur-2xl border-t border-white/10 flex justify-around items-center z-50">
        <button 
          onClick={() => setActiveTab('cases')}
          className={`p-3 rounded-xl ${activeTab === 'cases' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
        >
          <ShoppingBag size={24} />
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`p-3 rounded-xl ${activeTab === 'inventory' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
        >
          <LayoutGrid size={24} />
        </button>
      </nav>
    </div>
  );
}
