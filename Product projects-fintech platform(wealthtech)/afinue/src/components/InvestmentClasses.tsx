import { LayoutGrid, Building2, Truck, Wine } from 'lucide-react';
import { motion } from 'motion/react';

const classes = [
  {
    title: 'Asset Leasing',
    icon: Truck,
    description: 'Invest in equipment and machinery for fast-growing companies with fixed monthly payouts.',
    returns: '14-16% IRR',
    color: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    title: 'Real Estate',
    icon: Building2,
    description: 'Premium commercial and residential properties on a subvention basis with high capital appreciation.',
    returns: '18-22% Target',
    color: 'bg-indigo-50',
    iconColor: 'text-indigo-600'
  },
  {
    title: 'Collectibles',
    icon: Wine,
    description: 'Rare Scotch, art, and limited edition assets that appreciate with scarcity and time.',
    returns: '15%+ Historical',
    color: 'bg-amber-50',
    iconColor: 'text-amber-600'
  },
  {
    title: 'Corporate Debt',
    icon: LayoutGrid,
    description: 'Short-term raw material financing for top-tier Indian corporates with high safety ratings.',
    returns: '11-13% XIRR',
    color: 'bg-green-50',
    iconColor: 'text-green-600'
  }
];

export default function InvestmentClasses() {
  return (
    <section id="opportunities" className="py-24 bg-natural-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-serif font-bold text-natural-text mb-4 italic">Investment Classes</h2>
            <p className="text-lg text-natural-muted font-medium">
              Diversify your capital across unique asset categories, each designed to optimize returns and risk.
            </p>
          </div>
          <button className="text-[10px] font-bold text-natural-primary uppercase tracking-widest border-b border-natural-primary pb-1 hover:text-natural-text hover:border-natural-text transition-all">
            View All Opportunities
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {classes.map((cls, index) => (
            <motion.div
              key={cls.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-8 rounded-[32px] bg-white border border-natural-border group hover:translate-y-[-4px] transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)]`}
            >
              <div className={`w-14 h-14 bg-natural-surface rounded-2xl border border-natural-border flex items-center justify-center text-natural-primary mb-8 shadow-sm transition-all group-hover:rotate-12 group-hover:bg-natural-primary group-hover:text-white`}>
                <cls.icon size={28} />
              </div>
              <h3 className="text-sm font-bold text-natural-text mb-2 uppercase tracking-widest">{cls.title}</h3>
              <p className="text-natural-muted text-xs mb-8 leading-relaxed font-medium">{cls.description}</p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-natural-surface">
                <span className="text-[10px] uppercase tracking-widest font-bold text-natural-muted">Est. Returns</span>
                <span className={`text-sm font-bold text-natural-primary italic font-serif`}>{cls.returns}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
