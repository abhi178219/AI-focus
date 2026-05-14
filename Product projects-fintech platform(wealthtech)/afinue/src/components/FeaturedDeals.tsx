import { Star, Clock, MapPin, ArrowUpRight } from 'lucide-react';
import { Deal } from '../types';

const deals: Deal[] = [
  {
    id: '1',
    title: 'Fleet Expansion: EV Logistics',
    category: 'Asset Leasing',
    returns: '16.5%',
    tenure: '24 Months',
    minInvestment: '₹50,000',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop',
    status: 'Open',
    location: 'Bangalore, India'
  },
  {
    id: '2',
    title: 'Pre-leased Office: Tech Park',
    category: 'Real Estate',
    returns: '19.2%',
    tenure: '36 Months',
    minInvestment: '₹2,00,000',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop',
    status: 'Soon',
    location: 'Hyderabad, India'
  },
  {
    id: '3',
    title: 'Vintage Scotch Cask Collection',
    category: 'Collectibles',
    returns: '15.0%',
    tenure: '60 Months',
    minInvestment: '₹1,00,000',
    image: 'https://images.unsplash.com/photo-1527281405159-3b0a6513565f?q=80&w=800&auto=format&fit=crop',
    status: 'Open',
    location: 'Edinburgh, UK'
  }
];

interface FeaturedDealsProps {
  onViewDeal?: (deal: Deal) => void;
}

export default function FeaturedDeals({ onViewDeal }: FeaturedDealsProps) {
  return (
    <section id="featured-deals" className="py-24 bg-natural-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-16">
          <div>
            <h2 className="text-4xl font-serif font-bold text-natural-text mb-2 italic">Featured Opportunities</h2>
            <p className="text-natural-muted font-medium">Handpicked high-yield opportunities available now.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {deals.map((deal) => (
            <div 
              key={deal.id} 
              onClick={() => onViewDeal?.(deal)}
              className="bg-white rounded-[32px] overflow-hidden border border-natural-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] hover:translate-y-[-4px] transition-all duration-500 cursor-pointer"
            >
              <div className="p-5">
                <div className="relative h-48 rounded-[24px] overflow-hidden mb-6">
                  <img 
                    src={deal.image} 
                    alt={deal.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-natural-text/40 to-transparent"></div>
                  <div className="absolute bottom-3 left-4 text-white text-[10px] font-bold uppercase tracking-widest bg-natural-primary/80 backdrop-blur-sm px-2 py-1 rounded-full">
                    {deal.category}
                  </div>
                </div>
                
                <h3 className="text-xl font-serif font-bold text-natural-text mb-6 italic">{deal.title}</h3>

                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-natural-muted mb-8">
                  <span>Est. IRR: <b className="text-natural-primary">{deal.returns}</b></span>
                  <span>Tenure: <b className="text-natural-primary">{deal.tenure}</b></span>
                </div>

                <div className="pt-4 border-t border-natural-border flex items-center justify-between">
                  <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">
                    <span className="text-natural-text">{deal.minInvestment}</span> Min.
                  </div>
                  <button className="text-natural-primary text-[10px] font-bold uppercase tracking-widest underline underline-offset-4 hover:text-natural-text transition-colors">
                    View Deal
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
