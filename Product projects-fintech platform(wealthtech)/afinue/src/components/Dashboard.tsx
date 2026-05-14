import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ArrowUpRight, TrendingUp, Wallet, PieChart, Info, Check, X, MapPin, Calendar, Users, ChevronRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { InvestmentClass, Deal, User } from '../types';
import { ViewState } from '../App';
import Portfolio from './Portfolio';
import ReferAndEarn from './ReferAndEarn';
import Profile from './Profile';
import DealDetails from './DealDetails';
import Insights from './Insights';

const allOpportunities: Deal[] = [
  {
    id: '1',
    title: 'Precision Machining Equipment',
    category: 'Asset Leasing',
    returns: '15.5%',
    tenure: '36 Mo',
    minInvestment: '₹25,000',
    status: 'Open',
    image: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?q=80&w=600&auto=format&fit=crop',
    location: 'Pune, Maharashtra',
    description: 'Leasing of high-precision CNC machines to a Tier-1 automotive component manufacturer with a 10-year track record.',
    irr: 15.5
  },
  {
    id: '2',
    title: 'Prime Commercial Sec-62',
    category: 'Real Estate',
    returns: '21.0%',
    tenure: '48 Mo',
    minInvestment: '₹5,00,000',
    status: 'Open',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop',
    location: 'Gurugram, HR',
    description: 'Grade-A office space in a prime business hub. Fully leased to a multinational tech firm with fixed annual escalations.',
    irr: 21.0
  },
  {
    id: '3',
    title: 'Macallan 1991 Cask',
    category: 'Collectibles',
    returns: '14.2%',
    tenure: '24 Mo',
    minInvestment: '₹1,50,000',
    status: 'Soon',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=600&auto=format&fit=crop',
    location: 'Speyside, Scotland',
    description: 'Rare single malt scotch whisky cask. Historical appreciation of similar casks has exceeded 12% annually.',
    irr: 14.2
  },
  {
    id: '4',
    title: 'Luxury Retail Space Gurgaon',
    category: 'Real Estate',
    returns: '18.5%',
    tenure: '36 Mo',
    minInvestment: '₹2,50,000',
    status: 'Open',
    image: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?q=80&w=600&auto=format&fit=crop',
    location: 'Gurugram, HR',
    description: 'Ground floor retail unit in a high-footfall luxury mall. Excellent visibility and long-term rental potential.',
    irr: 18.5
  },
  {
    id: '5',
    title: 'IT Hardware Leasing - Tier 1',
    category: 'Asset Leasing',
    returns: '16.0%',
    tenure: '18 Mo',
    minInvestment: '₹50,000',
    status: 'Closed',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop',
    location: 'Pan-India',
    description: 'Portfolio of laptops and servers leased to leading SaaS companies. High liquidity and shorter tenure.',
    irr: 16.0
  },
  {
    id: '6',
    title: 'Glenfiddich Rare Vintage',
    category: 'Collectibles',
    returns: '15.8%',
    tenure: '48 Mo',
    minInvestment: '₹75,000',
    status: 'Open',
    image: 'https://images.unsplash.com/photo-1569091791842-7cfb64e04047?q=80&w=600&auto=format&fit=crop',
    location: 'Speyside, Scotland',
    description: 'Limited edition bottling from the distillery\'s private reserve. Highly sought after by global collectors.',
    irr: 15.8
  },
  {
    id: '7',
    title: 'Smart Energy Meters',
    category: 'Asset Leasing',
    returns: '16.5%',
    tenure: '36 Mo',
    minInvestment: '₹20,000',
    status: 'Closed',
    image: 'https://images.unsplash.com/photo-1592833159155-c62df1b35625?q=80&w=600&auto=format&fit=crop',
    location: 'Rajasthan, IN',
    description: 'Leasing of smart energy meters to state electricity boards under a long-term contract.',
    irr: 16.5
  },
  {
    id: '8',
    title: 'Modern Warehousing - Hub A',
    category: 'Real Estate',
    returns: '14.5%',
    tenure: '60 Mo',
    minInvestment: '₹10,00,000',
    status: 'Closed',
    image: 'https://images.unsplash.com/photo-1586528116311-ad86d600397d?q=80&w=600&auto=format&fit=crop',
    location: 'Bhiwandi, MH',
    description: 'Multi-tenant Grade-A distribution center serving e-commerce giants. Completed and fully occupied.',
    irr: 14.5
  }
];

interface DashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  activeView: ViewState;
  onSwitchView: (view: ViewState) => void;
}

export default function Dashboard({ user, onUpdateUser, activeView, onSwitchView }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<InvestmentClass | 'All' | 'Closed'>('All');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const filteredOpportunities = useMemo(() => {
    return allOpportunities.filter(opp => {
      const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           opp.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = false;
      if (selectedCategory === 'All') {
        matchesCategory = opp.status !== 'Closed';
      } else if (selectedCategory === 'Closed') {
        matchesCategory = opp.status === 'Closed';
      } else {
        matchesCategory = opp.category === selectedCategory && opp.status !== 'Closed';
      }

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="pt-24 pb-20 bg-natural-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Area (Constant) */}
          {activeView !== 'deal-details' && (
            <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
              <div className="bg-natural-surface p-8 rounded-[24px] border border-natural-border flex flex-col gap-4">
                <h2 className="font-serif text-2xl text-natural-text italic">Live Market Stats</h2>
                <div className="space-y-6 mt-2">
                  <div className="flex justify-between items-end border-b border-natural-border pb-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-1">Asset Backed</div>
                      <div className="text-xl font-bold text-natural-text">100%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-1">Total Funded</div>
                      <div className="text-xl font-bold text-natural-text">₹240Cr+</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-natural-primary rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </div>
                      <div className="text-[10px] font-bold text-natural-text uppercase tracking-widest leading-loose">Physical collateral for every asset</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-natural-primary rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </div>
                      <div className="text-[10px] font-bold text-natural-text uppercase tracking-widest leading-loose">Legally vetted structures</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[24px] border border-natural-border flex flex-col gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="font-serif text-2xl text-natural-text italic">Portfolio Snapshot</h2>
                <div className="text-4xl font-bold text-natural-primary leading-none tracking-tight">₹12,45,000</div>
                <div className="flex items-center gap-2 text-[10px] text-green-600 font-bold uppercase tracking-widest mb-2">
                  <span>+8.4% this year</span>
                  <span className="px-1.5 py-0.5 bg-green-50 rounded">↑</span>
                </div>
                <button 
                  onClick={() => onSwitchView('portfolio')}
                  className="bg-natural-primary text-white py-4 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-natural-primary/20 hover:bg-natural-primary/90 transition-all font-sans"
                >
                  Go to Portfolio
                </button>
              </div>
              
              <div 
                onClick={() => onSwitchView('referral')}
                className="bg-natural-text p-6 rounded-[24px] text-white cursor-pointer group overflow-hidden relative shadow-lg"
              >
                <div className="relative z-10">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">Invite Friends</div>
                  <div className="text-xl font-serif italic mb-4">Earn ₹2,500 for every referral that joins.</div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest group-hover:gap-4 transition-all">
                    Refer Now <ChevronRight size={14} />
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* KYC Banner */}
            {user.kyc?.status !== ('Approved' as string) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-8 p-4 rounded-[24px] border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${
                  (user.kyc?.status as string) === 'Approved'
                    ? 'bg-green-50 border-green-100 text-green-800'
                    : (user.kyc?.status as string) === 'Rejected' 
                    ? 'bg-red-50 border-red-100 text-red-800' 
                    : (user.kyc?.status as string) === 'Under Review'
                    ? 'bg-blue-50 border-blue-100 text-blue-800'
                    : 'bg-[#FFF5F5] border-red-100 text-[#C53030]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    (user.kyc?.status as string) === 'Approved' ? 'bg-green-100' :
                    (user.kyc?.status as string) === 'Rejected' ? 'bg-red-100' : 
                    (user.kyc?.status as string) === 'Under Review' ? 'bg-blue-100' : 'bg-red-100/50'
                  }`}>
                    {(user.kyc?.status as string) === 'Approved' ? <CheckCircle2 size={18} /> :
                     (user.kyc?.status as string) === 'Rejected' ? <X size={18} /> : 
                     (user.kyc?.status as string) === 'Under Review' ? <Calendar size={18} /> : <ShieldCheck size={18} />}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">
                      {(user.kyc?.status as string) === 'Approved' ? 'Account Verified' :
                       (user.kyc?.status as string) === 'Rejected' ? 'Action Required' : 
                       (user.kyc?.status as string) === 'Under Review' ? 'Pending Verification' : 'Verification Needed'}
                    </h4>
                    <p className="text-xs font-bold mt-0.5">
                      {(user.kyc?.status as string) === 'Approved' ? 'Your KYC is approved. You can now invest in any deal.' :
                       (user.kyc?.status as string) === 'Rejected' ? 'KYC Rejected. Please update your details and resubmit.' : 
                       (user.kyc?.status as string) === 'Under Review' ? 'KYC Under Review. This usually takes 24-48 business hours.' : 
                       'Complete your KYC to start investing and earn real returns.'}
                    </p>
                  </div>
                </div>
                {activeView !== 'profile' && (
                  <button 
                    onClick={() => onSwitchView('profile')}
                    className="shrink-0 bg-white/50 backdrop-blur-sm px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-current hover:bg-white transition-all"
                  >
                    {user.kyc?.status === 'Rejected' ? 'Update KYC' : 'Complete KYC'}
                  </button>
                )}
              </motion.div>
            )}

            {activeView === 'opportunities' && (
              <div className="space-y-8">
                {/* Search & Filter Header */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-3xl font-serif italic text-natural-text">Investment Opportunities</h1>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-natural-muted group-focus-within:text-natural-primary transition-colors" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search assets, locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-6 py-4 bg-white border border-natural-border rounded-full text-sm font-bold w-full md:w-80 outline-none focus:border-natural-primary transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <Filter size={16} className="text-natural-primary shrink-0" />
                    {(['All', 'Asset Leasing', 'Real Estate', 'Collectibles', 'Closed'] as const).map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 border ${
                          selectedCategory === cat 
                          ? 'bg-natural-primary text-white border-natural-primary shadow-md shadow-natural-primary/20' 
                          : 'bg-white text-natural-muted border-natural-border hover:border-natural-primary hover:text-natural-primary'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opportunities Grid */}
                {filteredOpportunities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredOpportunities.map((opp, index) => (
                      <motion.div
                        key={opp.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => {
                          setSelectedDeal(opp);
                          onSwitchView('deal-details');
                        }}
                        className="bg-white rounded-[32px] p-6 border border-natural-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between group hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] hover:translate-y-[-4px] transition-all duration-500 cursor-pointer"
                      >
                        <div className="space-y-4">
                          <div className="h-48 bg-natural-border rounded-[24px] overflow-hidden relative">
                            <img 
                              src={opp.image} 
                              alt={opp.title} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-natural-text/50 to-transparent opacity-60"></div>
                            <div className="absolute bottom-3 left-4 text-white text-[10px] font-bold uppercase tracking-widest bg-natural-primary/80 backdrop-blur-sm px-3 py-1.5 rounded-full">{opp.category}</div>
                            {opp.status === 'Soon' && (
                              <div className="absolute top-4 right-4 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Coming Soon</div>
                            )}
                            {opp.status === 'Closed' && (
                              <div className="absolute top-4 right-4 bg-gray-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Fully Funded</div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">
                              <MapPin size={10} /> {opp.location}
                            </div>
                            <h3 className="text-xl font-serif font-bold text-natural-text italic leading-tight group-hover:text-natural-primary transition-colors">{opp.title}</h3>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-natural-muted border-t border-natural-surface pt-4">
                            <span>Est. IRR: <b className="text-natural-primary italic font-serif text-sm">{opp.returns}</b></span>
                            <span>Tenure: <b className="text-natural-text text-sm">{opp.tenure}</b></span>
                          </div>
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">
                            <span className="text-natural-text text-xs">{opp.minInvestment}</span> Min.
                          </div>
                          <button className="text-natural-primary text-[10px] font-bold uppercase tracking-widest underline underline-offset-4 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                            View Deal <ArrowUpRight size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    <div className="bg-natural-primary rounded-[32px] p-8 border border-natural-primary text-natural-bg flex flex-col justify-center items-center text-center gap-6 min-h-[350px] shadow-xl shadow-natural-primary/20">
                      <div className="text-xl italic font-serif opacity-90 leading-relaxed">Exclusive access to premier alternate alpha is just a few clicks away...</div>
                      <div className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">Next Batch in 48h</div>
                      <button className="text-[10px] uppercase tracking-widest font-bold border border-white/30 px-8 py-4 rounded-full hover:bg-natural-surface hover:text-natural-primary hover:border-natural-surface transition-all">Notify Me of New Deals</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white py-20 text-center rounded-[32px] border border-natural-border border-dashed">
                    <p className="text-natural-muted font-medium italic">No opportunities match your search criteria. Try broadening your terms.</p>
                  </div>
                )}
              </div>
            )}

            {activeView === 'portfolio' && <Portfolio />}
            {activeView === 'referral' && <ReferAndEarn />}
            {activeView === 'profile' && <Profile user={user} onUpdateUser={onUpdateUser} />}
            
            {activeView === 'insights' && <Insights />}

            {activeView === 'deal-details' && selectedDeal && (
              <DealDetails 
                deal={selectedDeal} 
                onBack={() => onSwitchView('opportunities')}
                onSimilarDealClick={(deal) => setSelectedDeal(deal)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
