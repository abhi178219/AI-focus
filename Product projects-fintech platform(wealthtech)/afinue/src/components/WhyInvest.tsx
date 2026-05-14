import { CheckCircle2, ShieldCheck, Zap, Globe2 } from 'lucide-react';

const reasons = [
  {
    icon: ShieldCheck,
    title: 'Asset-Backed Security',
    description: 'Every investment is secured by physical assets, from industrial machinery to prime real estate, ensuring lower volatility.'
  },
  {
    icon: Zap,
    title: 'High-Yield Returns',
    description: 'Our alternate deals consistently outperform traditional investment avenues by targeting niche subvention and leasing markets.'
  },
  {
    icon: Globe2,
    title: 'Diversification Redefined',
    description: 'Go beyond stocks and gold. Gain exposure to scotch collectibles and industrial debt with low correlation to equity markets.'
  },
  {
    icon: CheckCircle2,
    title: 'Professional Oversight',
    description: 'Our team conducts deep asset-level due diligence, managing everything from sourcing to legal structuring and final exits.'
  }
];

export default function WhyInvest() {
  return (
    <section id="partner" className="py-24 bg-natural-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-4xl font-serif font-bold text-natural-text mb-6 leading-tight italic">
              Why Savvy Investors <br /> Choose Afinue
            </h2>
            <p className="text-natural-muted text-lg mb-10 leading-relaxed font-medium">
              We bridge the gap between institutional asset opportunities and retail investors, 
              providing transparency, security, and superior risk-adjusted returns.
            </p>
            
            <div className="space-y-8">
              {reasons.map((reason) => (
                <div key={reason.title} className="flex items-start group">
                  <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-natural-primary flex items-center justify-center text-white transition-all group-hover:scale-110 shadow-sm shadow-natural-primary/20">
                    <reason.icon size={16} />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-bold text-natural-text uppercase tracking-widest">{reason.title}</h4>
                    <p className="text-natural-muted text-sm mt-1 leading-relaxed font-medium">{reason.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full relative">
            <div className="relative z-10 rounded-[40px] overflow-hidden border-8 border-natural-surface shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop" 
                alt="Modern Real Estate" 
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Design accents */}
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-natural-surface rounded-[2rem] -z-10 bg-gradient-to-tr from-natural-border/20 to-transparent"></div>
            <div className="absolute -top-6 -right-6 w-32 h-32 border-4 border-natural-border rounded-full -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
