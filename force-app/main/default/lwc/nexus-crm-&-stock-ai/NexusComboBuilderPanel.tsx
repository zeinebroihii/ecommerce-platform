import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Cpu, 
  Layers, 
  Monitor, 
  HardDrive, 
  Gamepad2, 
  Box,
  Zap,
  ShoppingCart,
  RotateCcw,
  Save,
  Share2,
  Edit2,
  Copy,
  FolderHeart
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NexusButton } from './ui/NexusButton';
import { NexusBadge } from './ui/NexusBadge';
import { useComboBuilder } from '../context/ComboBuilderContext';

export interface ComboProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
}

export interface ComboSlot {
  id: string;
  label: string;
  icon: any;
  category: string;
  product: ComboProduct | null;
  isLocked?: boolean;
}

interface NexusComboBuilderPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  slots: ComboSlot[];
  onRemoveProduct: (slotId: string) => void;
  onAddAllToCart: () => void;
  onReset: () => void;
  totalCost: number;
  totalSavings: number;
  wattageEstimate: number;
}

export const NexusComboBuilderPanel: React.FC<NexusComboBuilderPanelProps> = ({
  isOpen,
  onClose,
  onOpen,
  isMinimized,
  setIsMinimized,
  slots,
  onRemoveProduct,
  onAddAllToCart,
  onReset,
  totalCost,
  totalSavings,
  wattageEstimate
}) => {
  const {
    savedLists,
    saveCurrentList,
    loadList,
    removeSavedList,
    renameSavedList,
    duplicateSavedList,
    activeListId,
    hasBeenInitialized,
    navigateToCatalog,
  } = useComboBuilder();

  const [isNamingModalOpen, setIsNamingModalOpen] = useState(false);
  const [isRenamingModalOpen, setIsRenamingModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [renameValue, setRenameValue] = useState('');

  const activeList = savedLists.find(l => l.id === activeListId);
  const selectedCount = slots.filter(s => s.product).length;

  const handleSaveList = () => {
    if (activeList) {
      saveCurrentList(activeList.name); // Overwrite/Update logic could be here, but for now just save new
    } else {
      setIsNamingModalOpen(true);
    }
  };

  const confirmSave = () => {
    if (newListName.trim()) {
      saveCurrentList(newListName.trim());
      setNewListName('');
      setIsNamingModalOpen(false);
    }
  };

  const handleRename = () => {
    if (activeList) {
      setRenameValue(activeList.name);
      setIsRenamingModalOpen(true);
    }
  };

  const confirmRename = () => {
    if (activeList && renameValue.trim()) {
      renameSavedList(activeList.id, renameValue.trim());
      setIsRenamingModalOpen(false);
    }
  };

  return (
    <>
      {/* Toggle Tab — only visible after 'Build with it' has been clicked */}
      <AnimatePresence>
        {hasBeenInitialized && (
          <motion.button
            initial={{ x: 100 }}
            animate={{ x: 0 }}
            exit={{ x: 100 }}
            onClick={() => {
              if (!isOpen) {
                onOpen();
                setIsMinimized(false);
              } else {
                setIsMinimized(!isMinimized);
              }
            }}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-[310] bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.1)] border border-slate-200 border-r-0 rounded-l-2xl p-3 flex flex-col items-center gap-2 group"
          >
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black uppercase tracking-widest text-slate-900 py-2">
              Combo Builder
            </div>
            {isOpen && !isMinimized ? (
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Panel */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMinimized(true)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[290]"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-[45vw] min-w-[400px] bg-white z-[300] flex flex-col overflow-hidden shadow-[-20px_0_60px_rgba(0,0,0,0.15)] border-l border-slate-100"
            >
            {/* Saved Lists Bar - Enhanced Glassmorphism & Sticky */}
            <div className="bg-slate-900/80 backdrop-blur-xl px-6 py-2 flex items-center justify-between border-b border-white/10 sticky top-0 z-30 shadow-lg">
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar flex-grow py-1">
                <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5 mr-2">
                  <FolderHeart className="w-3 h-3 text-emerald-400" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {savedLists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => loadList(list.id)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                        activeListId === list.id 
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20" 
                          : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border-white/5"
                      )}
                    >
                      {list.name}
                    </button>
                  ))}
                  {savedLists.length === 0 && (
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest italic">No saved builds</span>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => {
                  onReset();
                  setIsNamingModalOpen(true);
                }}
                className="ml-4 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all whitespace-nowrap shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-3 h-3" /> New Build
              </button>
            </div>

            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-600/20">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                      {activeList ? activeList.name : "Nexus Combo Builder"}
                    </h2>
                    {activeList && (
                      <div className="flex items-center gap-4 mt-1">
                        <button 
                          onClick={handleRename}
                          className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline"
                        >
                          <Edit2 className="w-3 h-3" /> Rename
                        </button>
                        <button 
                          onClick={() => duplicateSavedList(activeList.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline"
                        >
                          <Copy className="w-3 h-3" /> Duplicate
                        </button>
                        <button 
                          onClick={() => removeSavedList(activeList.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-rose-600 uppercase tracking-widest hover:underline"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsMinimized(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" /> Minimize
                  </button>
                  <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-lg">
                    <button className="p-1.5 hover:bg-white rounded-md transition-all"><Share2 className="w-3.5 h-3.5 text-slate-600" /></button>
                    <button 
                      onClick={() => setIsNamingModalOpen(true)}
                      className="p-1.5 hover:bg-white rounded-md transition-all"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-12 px-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Component</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Product</div>
              </div>
            </div>

            {/* Content - Slots List */}
            <div className="flex-grow overflow-y-auto p-6 space-y-0 divide-y divide-slate-100">
              {slots.map((slot) => (
                <div key={slot.id} className="py-6 first:pt-0 last:pb-0 flex items-start gap-8 group">
                  {/* Slot Info */}
                  <div className="w-24 flex flex-col items-center text-center flex-shrink-0">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mb-2 transition-all duration-500 border-2 overflow-hidden",
                      slot.product ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-100 text-slate-300 group-hover:border-emerald-200 group-hover:text-emerald-400"
                    )}>
                      {(() => {
                        const Icon = slot.icon;
                        if (!Icon) return <Box className="w-8 h-8" />;
                        
                        return !slot.product ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={`https://picsum.photos/seed/${slot.id}/100/100`} 
                              alt={slot.label} 
                              className="w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity"
                            />
                            <Icon className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10" />
                          </div>
                        ) : (
                          <Icon className="w-8 h-8" />
                        );
                      })()}
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      slot.product ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"
                    )}>
                      {slot.label}
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="flex-grow flex items-center min-w-0">
                    {slot.product ? (
                      <div className="flex items-center gap-6 w-full">
                        <div className="w-24 h-24 bg-slate-50 rounded-xl p-2 flex-shrink-0 border border-slate-100">
                          <img src={slot.product.image} alt={slot.product.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-sm font-black text-slate-900 leading-tight mb-1 line-clamp-2">{slot.product.name}</h4>
                          <div className="flex items-center gap-4 mb-2">
                            <NexusBadge variant="primary" className="bg-amber-500 border-none text-[8px] font-black uppercase tracking-widest">
                              Save $60.00 W/ Combo Up Offer
                            </NexusBadge>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-100">
                              <button className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-400 hover:text-slate-900 transition-all">-</button>
                              <span className="text-xs font-black w-4 text-center">1</span>
                              <button className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-400 hover:text-slate-900 transition-all">+</button>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Limit 2</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-black text-slate-900 tracking-tighter">${(slot.product.price || 0).toFixed(2)}</div>
                          {!slot.isLocked && (
                            <button 
                              onClick={() => onRemoveProduct(slot.id)}
                              className="mt-4 p-2 text-slate-300 hover:text-rose-500 transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                          {slot.isLocked && (
                            <div className="mt-4 p-2 text-slate-300 cursor-not-allowed opacity-50">
                              <Box className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col gap-2">
                        <NexusButton
                          variant="outline"
                          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-black uppercase tracking-widest text-[10px] h-10 px-6 flex items-center gap-2"
                          onClick={() => navigateToCatalog(slot.id, slot.category)}
                        >
                          <Plus className="w-4 h-4" /> Browse &amp; Select
                        </NexusButton>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                          Opens catalogue filtered by {slot.label}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Summary */}
            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <div className="flex flex-col items-end gap-2 mb-6">
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                  <span>Part(s) Selected: <span className="text-slate-900 font-black">{selectedCount}</span></span>
                  <span>Min. Wattage Estimate: <span className="text-slate-900 font-black">{wattageEstimate} Watts</span></span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Combo Up Savings:</span>
                  <span className="text-xl font-black text-rose-600 tracking-tighter">${(totalSavings || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Cost:</span>
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">${(totalCost || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button 
                  onClick={onReset} 
                  className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline"
                >
                  Reset
                </button>
                <div className="flex gap-4">
                  <NexusButton 
                    variant="outline" 
                    onClick={handleSaveList}
                    className="border-slate-300 text-slate-600 font-black uppercase tracking-widest h-14 px-8 hover:bg-white"
                  >
                    Save List
                  </NexusButton>
                  <NexusButton 
                    onClick={onAddAllToCart}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest h-14 px-10 rounded-xl border-none flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    Add All To Cart <ChevronRight className="w-5 h-5" />
                  </NexusButton>
                </div>
              </div>
            </div>

            {/* Naming Modal */}
            <AnimatePresence>
              {isNamingModalOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[350] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="bg-white rounded-3xl p-5 w-full max-w-[240px] shadow-2xl border border-slate-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">Save Build</h3>
                      <button onClick={() => setIsNamingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <input 
                      autoFocus
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="Name..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:border-emerald-600 outline-none transition-all mb-3"
                      onKeyDown={(e) => e.key === 'Enter' && confirmSave()}
                    />

                    <NexusButton 
                      className="w-full h-9 bg-emerald-600 text-white border-none text-[9px] font-black uppercase tracking-widest"
                      onClick={confirmSave}
                    >
                      Save Build
                    </NexusButton>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Renaming Modal */}
            <AnimatePresence>
              {isRenamingModalOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[350] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="bg-white rounded-3xl p-5 w-full max-w-[240px] shadow-2xl border border-slate-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">Rename Build</h3>
                      <button onClick={() => setIsRenamingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <input 
                      autoFocus
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:border-emerald-600 outline-none transition-all mb-3"
                      onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                    />

                    <NexusButton 
                      className="w-full h-9 bg-emerald-600 text-white border-none text-[9px] font-black uppercase tracking-widest"
                      onClick={confirmRename}
                    >
                      Update Name
                    </NexusButton>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
};
