import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, TrendingUp, Gem } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  return (
    <section id="hero" className="relative pt-32 pb-20 overflow-hidden bg-natural-bg">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -z-10 opacity-10 blur-3xl transform translate-x-1/4 -translate-y-1/4">
        <div className="w-[800px] h-[800px] bg-gradient-to-br from-natural-primary to-natural-muted rounded-full"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-white/50 backdrop-blur-sm border border-natural-border text-natural-primary mb-12 shadow-sm">
              Discover Alternate Alpha
            </span>
            <h1 className="text-5xl md:text-8xl font-serif font-bold text-natural-text tracking-tight mb-8 leading-[1.1]">
              Invest in <span className="italic text-natural-primary">Exceptional</span> <br className="hidden md:block" />
              Tangible Assets.
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-natural-muted mb-12 leading-relaxed font-medium">
              Access institutional-grade equipment leasing, real estate subvention, 
              and rare collectibles. Build a portfolio that stands apart.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto px-10 py-5 bg-natural-primary text-white rounded-full font-bold text-sm uppercase tracking-widest flex items-center justify-center hover:bg-natural-primary/90 transition-all transform hover:scale-105 shadow-2xl shadow-natural-primary/30"
              >
                Join the Circle
                <ArrowRight className="ml-3" size={18} />
              </button>
              <button className="w-full sm:w-auto px-10 py-5 bg-white text-natural-text border border-natural-border rounded-full font-bold text-sm uppercase tracking-widest hover:bg-natural-surface hover:border-natural-primary transition-all shadow-sm">
                Explore Deals
              </button>
            </div>
          </motion.div>

          {/* Key Stats / Features summary */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-natural-border pt-16"
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-natural-primary border border-natural-border mb-4">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-xl font-serif font-bold text-natural-text italic">Alpha Returns</h3>
              <p className="text-natural-muted text-sm mt-1 font-medium">Consistently beating traditional markets</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-natural-primary border border-natural-border mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-serif font-bold text-natural-text italic">Vetted Assets</h3>
              <p className="text-natural-muted text-sm mt-1 font-medium">Rigorous due diligence on every deal</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-natural-primary border border-natural-border mb-4">
                <Gem size={24} />
              </div>
              <h3 className="text-xl font-serif font-bold text-natural-text italic">Rare Picks</h3>
              <p className="text-natural-muted text-sm mt-1 font-medium">Unique access to Scotch & collectibles</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
