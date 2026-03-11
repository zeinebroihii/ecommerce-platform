import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Truck, 
  ShieldCheck, 
  ArrowRight, 
  Package,
  Zap,
  Check
} from 'lucide-react';
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * UTILITIES
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * TYPES
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  family: string;
  price: number;
  image: string;
  [key: string]: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * HOOK: useNexusCart
 * Encapsulates all cart logic for reusability.
 */
export const useNexusCart = (initialCart: CartItem[] = []) => {
  const [cart, setCart] = useState<CartItem[]>(initialCart);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const subtotal = useMemo(() => 
    cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0),
  [cart]);

  const totalItems = useMemo(() => 
    cart.reduce((acc, item) => acc + item.quantity, 0),
  [cart]);

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    totalItems
  };
};

/**
 * COMPONENT: NexusCartItem
 */
export const NexusCartItem: React.FC<{
  item: CartItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}> = ({ item, onUpdateQuantity, onRemove }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="group relative bg-white rounded-3xl p-4 border border-slate-100 hover:border-indigo-600 hover:shadow-xl transition-all duration-500"
  >
    <div className="flex items-center gap-5">
      <div className="w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 relative">
        <img 
          src={item.product.image} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          alt={item.product.name} 
        />
      </div>
      
      <div className="flex-grow">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">
              {item.product.family}
            </div>
            <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase italic leading-none">
              {item.product.name}
            </h4>
          </div>
          <button 
            onClick={() => onRemove(item.product.id)}
            className="p-2 text-slate-300 hover:text-rose-500 transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-1 border border-slate-100">
            <button 
              onClick={() => onUpdateQuantity(item.product.id, -1)}
              className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm hover:bg-slate-900 hover:text-white transition-all"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-sm font-black w-6 text-center text-slate-900">{item.quantity}</span>
            <button 
              onClick={() => onUpdateQuantity(item.product.id, 1)}
              className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm hover:bg-slate-900 hover:text-white transition-all"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <div className="text-xl font-black text-slate-900 italic">${item.product.price * item.quantity}</div>
        </div>
      </div>
    </div>
  </motion.div>
);

/**
 * COMPONENT: NexusCartSummary
 */
export const NexusCartSummary: React.FC<{
  subtotal: number;
  onCheckout: () => void;
}> = ({ subtotal, onCheckout }) => {
  const shipping = subtotal > 5000 ? 0 : 45;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50 sticky top-24">
      <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter uppercase italic">Order Summary</h3>
      
      <div className="space-y-5 mb-10">
        <div className="flex justify-between text-slate-500 font-bold">
          <span className="text-sm">Subtotal</span>
          <span className="text-slate-900 font-black">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-500 font-bold">
          <span className="text-sm">Shipping</span>
          <span className="text-slate-900 font-black">
            {shipping === 0 ? <span className="text-emerald-600">FREE</span> : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between text-slate-500 font-bold">
          <span className="text-sm">Estimated Tax</span>
          <span className="text-slate-900 font-black">${tax.toFixed(2)}</span>
        </div>
        <div className="pt-5 border-t border-slate-100 flex justify-between items-end">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Amount</span>
            <span className="text-4xl font-black text-slate-900 italic tracking-tighter">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button 
          onClick={onCheckout}
          className="w-full h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all duration-500 shadow-xl shadow-slate-900/10 group"
        >
          <span className="font-black uppercase tracking-widest italic">Proceed to Checkout</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
        </button>
        
        <div className="flex items-center justify-center gap-6 pt-4">
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Secure Payment
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <Truck className="w-4 h-4 text-indigo-500" />
            Fast Delivery
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * MAIN COMPONENT: NexusCartSystem
 * The complete standalone cart system.
 */
export const NexusCartSystem: React.FC<{
  initialItems?: CartItem[];
  onCheckout?: (cart: CartItem[]) => void;
  onBrowseCatalog?: () => void;
}> = ({ initialItems = [], onCheckout, onBrowseCatalog }) => {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    subtotal, 
    totalItems 
  } = useNexusCart(initialItems);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Cart List Section */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">My Cart</h2>
                <p className="text-slate-500 font-bold text-sm mt-1">Manage your selected Nexus products</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{totalItems} Items</span>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-400 uppercase italic tracking-tighter mb-4">Your cart is empty</h3>
                <button 
                  onClick={onBrowseCatalog}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest italic hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10"
                >
                  Explore Catalog
                </button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <NexusCartItem 
                    key={item.product.id} 
                    item={item} 
                    onUpdateQuantity={updateQuantity} 
                    onRemove={removeFromCart} 
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {cart.length > 0 && (
            <div className="mt-12 p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 flex items-center gap-6">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                <Zap className="w-8 h-8 fill-emerald-600" />
              </div>
              <div>
                <h4 className="text-lg font-black text-emerald-900 uppercase italic tracking-tighter">Nexus Intelligence</h4>
                <p className="text-sm text-emerald-700 font-bold">
                  Free shipping applied! Your order qualifies for priority Nexus logistics.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className="lg:col-span-4">
          {cart.length > 0 && (
            <NexusCartSummary 
              subtotal={subtotal} 
              onCheckout={() => onCheckout?.(cart)} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NexusCartSystem;
