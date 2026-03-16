import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface SubCategory {
  name: string;
  image: string;
}

interface Category {
  title: string;
  subCategories: SubCategory[];
}

const CATEGORIES: Category[] = [
  {
    title: 'PC Systems',
    subCategories: [
      { name: 'Desktop PC', image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&q=80&w=400' },
      { name: 'Laptops/ Notebooks', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=400' },
    ],
  },
  {
    title: 'Monitors & Peripherals',
    subCategories: [
      { name: 'Monitors', image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400' },
      { name: 'Keyboards & Mice', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400' },
      { name: 'Headsets & Speakers', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400' },
      { name: 'Hard Drive', image: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?auto=format&fit=crop&q=80&w=400' },
    ],
  },
  {
    title: 'Core Components',
    subCategories: [
      { name: 'CPU', image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=400' },
      { name: 'Graphics Card', image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=400' },
      { name: 'PC Cases', image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&q=80&w=400' },
      { name: 'Motherboards', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400' },
    ],
  },
  {
    title: 'Networking & Servers',
    subCategories: [
      { name: 'Wi-Fi & Networking', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=400' },
      { name: 'Servers & Workstations', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=400' },
    ],
  },
];

export const NexusCategories: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="w-full px-12 md:px-24">
        <div className="flex flex-col mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 text-emerald-600 font-black uppercase tracking-[0.4em] text-[10px] mb-4"
          >
            <div className="w-12 h-[2px] bg-emerald-600" />
            Product Ecosystem
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl md:text-6xl font-display font-black tracking-tighter leading-none text-slate-900 uppercase italic"
          >
            EXPLORE <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">CATEGORIES</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-slate-200">
          {CATEGORIES.map((category, idx) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="group bg-white p-10 flex flex-col border-r border-b border-slate-200 relative overflow-hidden"
            >
              {/* Technical Background Accent */}
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                <span className="font-mono text-8xl font-bold">0{idx + 1}</span>
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-12">
                  <h3 className="text-slate-900 text-xl font-display font-black tracking-tighter uppercase italic">
                    {category.title}
                  </h3>
                  <span className="font-mono text-[10px] text-slate-400 font-bold tracking-widest">
                    [NX-SEC-0{idx + 1}]
                  </span>
                </div>
                
                <div className={cn(
                  "grid gap-x-6 gap-y-16",
                  category.subCategories.length > 2 ? "grid-cols-2" : "grid-cols-1"
                )}>
                  {category.subCategories.map((sub, sIdx) => (
                    <div key={sub.name} className="group/item cursor-pointer relative">
                      <div className={cn(
                        "relative overflow-visible mb-6 flex items-center justify-center transition-all duration-700",
                        category.subCategories.length > 2 ? "aspect-square" : "aspect-[1.6/1]"
                      )}>
                        {/* Technical Crosshair/Grid behind image */}
                        <div className="absolute inset-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 pointer-events-none">
                          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-emerald-500/20" />
                          <div className="absolute top-0 left-1/2 w-[1px] h-full bg-emerald-500/20" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-emerald-500/20 rounded-full" />
                        </div>

                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-emerald-500/0 group-hover/item:bg-emerald-500/5 rounded-full blur-3xl transition-all duration-700 scale-0 group-hover/item:scale-150" />
                        
                        <img 
                          src={sub.image} 
                          alt={sub.name}
                          className="w-full h-full object-contain relative z-10 group-hover/item:scale-150 group-hover/item:-translate-y-4 transition-all duration-700 drop-shadow-[0_15px_35px_rgba(0,0,0,0.1)] group-hover/item:drop-shadow-[0_30px_60px_rgba(16,185,129,0.25)]"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="text-center relative z-10">
                        <div className="inline-block px-2 py-0.5 bg-slate-50 border border-slate-100 rounded mb-2 opacity-0 group-hover/item:opacity-100 transition-all duration-500 translate-y-2 group-hover/item:translate-y-0">
                          <span className="font-mono text-[8px] text-emerald-600 font-bold uppercase tracking-tighter">
                            Ready for Dispatch
                          </span>
                        </div>
                        <span className="text-slate-900 text-[11px] font-display font-black uppercase tracking-[0.25em] group-hover/item:text-emerald-600 transition-colors block">
                          {sub.name}
                        </span>
                        <div className="w-0 group-hover/item:w-full h-[1px] bg-emerald-500/30 mx-auto mt-2 transition-all duration-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Technical Bar */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50 group-hover:bg-emerald-500/10 transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
