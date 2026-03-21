import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Cpu, Layers, Monitor, HardDrive, Gamepad2, Box } from 'lucide-react';
import { ComboSlot, ComboProduct } from '../components/NexusComboBuilderPanel';

interface SavedCombo {
  id: string;
  name: string;
  slots: ComboSlot[];
}

interface ComboBuilderContextType {
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  slots: ComboSlot[];
  addOrUpdateProduct: (slotId: string, product: ComboProduct) => void;
  removeProduct: (slotId: string) => void;
  resetBuilder: () => void;
  activeSlotId: string | null;
  setActiveSlotId: (id: string | null) => void;
  totalCost: number;
  totalSavings: number;
  wattageEstimate: number;
  initializeWithCombo: (combo: any) => void;
  savedLists: SavedCombo[];
  saveCurrentList: (name: string) => void;
  loadList: (listId: string) => void;
  removeSavedList: (listId: string) => void;
  renameSavedList: (listId: string, newName: string) => void;
  duplicateSavedList: (listId: string) => void;
  activeListId: string | null;
  hasBeenInitialized: boolean;
  registerCatalogNavigation: (fn: (slotId: string, category: string) => void) => void;
  navigateToCatalog: (slotId: string, category: string) => void;
}

const DEFAULT_SLOTS: ComboSlot[] = [
  { id: 'cpu', label: 'CPU', icon: Cpu, category: 'pc-components', product: null },
  { id: 'motherboard', label: 'Motherboard', icon: Layers, category: 'pc-components', product: null },
  { id: 'memory', label: 'Memory', icon: Monitor, category: 'pc-components', product: null },
  { id: 'gpu', label: 'Graphics Cards', icon: Gamepad2, category: 'pc-components', product: null },
  { id: 'storage', label: 'Storage', icon: HardDrive, category: 'pc-components', product: null },
  { id: 'case', label: 'Case', icon: Box, category: 'pc-components', product: null },
];

const ComboBuilderContext = createContext<ComboBuilderContextType | undefined>(undefined);

export const ComboBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [slots, setSlots] = useState<ComboSlot[]>(DEFAULT_SLOTS);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [savedLists, setSavedLists] = useState<SavedCombo[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [hasBeenInitialized, setHasBeenInitialized] = useState(false);
  const [catalogNavFn, setCatalogNavFn] = useState<((slotId: string, category: string) => void) | null>(null);

  const addOrUpdateProduct = useCallback((slotId: string, product: ComboProduct) => {
    setSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, product } : slot
    ));
    setIsPanelOpen(true);
    setIsMinimized(false);
  }, []);

  const removeProduct = useCallback((slotId: string) => {
    setSlots(prev => prev.map(slot => {
      if (slot.id === slotId) {
        if (slot.isLocked) return slot; // Cannot remove locked products
        return { ...slot, product: null };
      }
      return slot;
    }));
  }, []);

  const resetBuilder = useCallback(() => {
    setSlots(prev => prev.map(slot => {
      if (slot.isLocked) return slot; // Keep locked products
      return { ...slot, product: null };
    }));
    setActiveSlotId(null);
  }, []);

  const saveCurrentList = useCallback((name: string) => {
    const newList: SavedCombo = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      slots: slots.map(slot => ({ ...slot })) // Shallow clone each slot to preserve icons
    };
    setSavedLists(prev => [...prev, newList]);
    setActiveListId(newList.id);
  }, [slots]);

  const loadList = useCallback((listId: string) => {
    const list = savedLists.find(l => l.id === listId);
    if (list) {
      // Reconstruct slots to ensure icons are correctly mapped from DEFAULT_SLOTS
      // This handles cases where icons might have been lost during serialization
      const restoredSlots = list.slots.map(savedSlot => {
        const defaultSlot = DEFAULT_SLOTS.find(ds => ds.id === savedSlot.id);
        return {
          ...savedSlot,
          icon: defaultSlot ? defaultSlot.icon : savedSlot.icon
        };
      });
      setSlots(restoredSlots);
      setActiveListId(list.id);
      setIsPanelOpen(true);
      setIsMinimized(false);
    }
  }, [savedLists]);

  const removeSavedList = useCallback((listId: string) => {
    setSavedLists(prev => prev.filter(l => l.id !== listId));
    if (activeListId === listId) setActiveListId(null);
  }, [activeListId]);

  const renameSavedList = useCallback((listId: string, newName: string) => {
    setSavedLists(prev => prev.map(l => l.id === listId ? { ...l, name: newName } : l));
  }, []);

  const duplicateSavedList = useCallback((listId: string) => {
    const list = savedLists.find(l => l.id === listId);
    if (list) {
      const newList: SavedCombo = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${list.name} (Copy)`,
        slots: list.slots.map(slot => ({ ...slot }))
      };
      setSavedLists(prev => [...prev, newList]);
    }
  }, [savedLists]);

  const initializeWithCombo = useCallback((combo: any) => {
    // Map combo products to slots
    const newSlots = DEFAULT_SLOTS.map(slot => {
      const product = combo.products.find((p: any) => {
        // Simple heuristic for mapping categories
        const name = p.name.toLowerCase();
        if (slot.id === 'cpu' && (name.includes('ryzen') || name.includes('intel'))) return true;
        if (slot.id === 'motherboard' && name.includes('motherboard')) return true;
        if (slot.id === 'memory' && (name.includes('ram') || name.includes('memory') || name.includes('vengeance'))) return true;
        if (slot.id === 'gpu' && (name.includes('rtx') || name.includes('radeon'))) return true;
        if (slot.id === 'storage' && (name.includes('ssd') || name.includes('nvme'))) return true;
        if (slot.id === 'case' && name.includes('case')) return true;
        return false;
      });
      return {
        ...slot,
        product: product ? { ...product, category: slot.id } : null,
        isLocked: !!product // Lock products that come from the combo deal
      };
    });
    setSlots(newSlots);
    setIsPanelOpen(true);
    setIsMinimized(false);
    setActiveListId(null);
    setHasBeenInitialized(true);
  }, []);

  const registerCatalogNavigation = useCallback((fn: (slotId: string, category: string) => void) => {
    setCatalogNavFn(() => fn);
  }, []);

  const navigateToCatalog = useCallback((slotId: string, category: string) => {
    setActiveSlotId(slotId);
    setIsMinimized(true);
    setCatalogNavFn((prev: ((slotId: string, category: string) => void) | null) => {
      if (prev) prev(slotId, category);
      return prev;
    });
  }, []);

  const totalCost = useMemo(() => 
    slots.reduce((acc, slot) => acc + (slot.product?.price || 0), 0),
  [slots]);

  const totalSavings = useMemo(() => 
    slots.filter(s => s.product).length * 20, // Mock savings
  [slots]);

  const wattageEstimate = useMemo(() => 
    slots.filter(s => s.product).length * 80 + 100, // Mock wattage
  [slots]);

  const value = useMemo(() => ({
    isPanelOpen,
    setIsPanelOpen,
    isMinimized,
    setIsMinimized,
    slots,
    addOrUpdateProduct,
    removeProduct,
    resetBuilder,
    activeSlotId,
    setActiveSlotId,
    totalCost,
    totalSavings,
    wattageEstimate,
    initializeWithCombo,
    savedLists,
    saveCurrentList,
    loadList,
    removeSavedList,
    renameSavedList,
    duplicateSavedList,
    activeListId,
    hasBeenInitialized,
    registerCatalogNavigation,
    navigateToCatalog,
  }), [
    isPanelOpen,
    isMinimized,
    slots,
    addOrUpdateProduct,
    removeProduct,
    resetBuilder,
    activeSlotId,
    totalCost,
    totalSavings,
    wattageEstimate,
    initializeWithCombo,
    savedLists,
    saveCurrentList,
    loadList,
    removeSavedList,
    renameSavedList,
    duplicateSavedList,
    activeListId,
    hasBeenInitialized,
    registerCatalogNavigation,
    navigateToCatalog,
  ]);

  return (
    <ComboBuilderContext.Provider value={value}>
      {children}
    </ComboBuilderContext.Provider>
  );
};

export const useComboBuilder = () => {
  const context = useContext(ComboBuilderContext);
  if (context === undefined) {
    throw new Error('useComboBuilder must be used within a ComboBuilderProvider');
  }
  return context;
};
