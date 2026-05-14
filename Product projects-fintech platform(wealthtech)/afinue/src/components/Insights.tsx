import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Newspaper, 
  BookOpen, 
  Calculator, 
  Users, 
  Award, 
  TrendingUp, 
  ArrowUpRight, 
  MessageSquare, 
  ThumbsUp,
  LineChart as ChartIcon,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  category: string;
  image: string;
}

interface BlogItem {
  id: string;
  title: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  excerpt: string;
}

interface Idea {
  id: string;
  content: string;
  upvotes: number;
  time: string;
  category: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress?: number;
}

const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Commercial Real Estate Yields Hit 15% in Tier-2 Indian Cities',
    source: 'Financial Times',
    time: '2h ago',
    category: 'Real Estate',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: '2',
    title: 'Rare Scotch Casks Outperforming Gold in Q1 2024',
    source: 'Asset Weekly',
    time: '5h ago',
    category: 'Collectibles',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: '3',
    title: 'New SEBI Regulations Proposed for Fractional Ownership Platforms',
    source: 'Economic Times',
    time: '1d ago',
    category: 'Policy',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=400&auto=format&fit=crop'
  }
];

const mockBlogs: BlogItem[] = [
  {
    id: '1',
    title: 'The Art of Redeployment: How to Maximize Alpha',
    author: 'Anita Sharma',
    date: 'May 10, 2024',
    readTime: '6 min read',
    excerpt: 'Redeploying your returns is the most powerful tool in an alternate investor\'s arsenal. Learn how to automate your compounding...',
    image: 'https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: '2',
    title: 'Why Scotch is More Than Just a Drink',
    author: 'James McArthur',
    date: 'May 08, 2024',
    readTime: '8 min read',
    excerpt: 'Understanding the scarcity and maturation cycles of rare single malt casks can help you build an inflation-proof portfolio.',
    image: 'https://images.unsplash.com/photo-1527281400828-ac737a93a6f8?q=80&w=400&auto=format&fit=crop'
  }
];

const mockIdeas: Idea[] = [
  {
    id: '1',
    content: 'We should see more opportunities in EV Charging infrastructure leasing. The demand is skyrocketing in metro cities.',
    upvotes: 42,
    time: '4h ago',
    category: 'Asset Leasing'
  },
  {
    id: '2',
    content: 'Grade-A warehouse spaces in North India seem undervalued compared to the current e-commerce boom.',
    upvotes: 28,
    time: '12h ago',
    category: 'Real Estate'
  },
  {
    id: '3',
    content: 'Is anyone tracking the liquidation value of antique timepieces? Specifically Patek Philippe references from the 90s.',
    upvotes: 15,
    time: '1d ago',
    category: 'Collectibles'
  }
];

const mockBadges: Badge[] = [
  {
    id: '1',
    name: 'Early Adopter',
    description: 'Joined Afinue in the first 10,000 users.',
    icon: <Award className="w-5 h-5" />,
    unlocked: true
  },
  {
    id: '2',
    name: 'Alpha Seeker',
    description: 'Invested in at least 3 different asset classes.',
    icon: <TrendingUp className="w-5 h-5" />,
    unlocked: false,
    progress: 66
  },
  {
    id: '3',
    name: 'Community Lead',
    description: 'Share 5 ideas that get more than 20 upvotes.',
    icon: <Users className="w-5 h-5" />,
    unlocked: false,
    progress: 20
  }
];

export default function Insights() {
  const [activeTab, setActiveTab] = useState<'content' | 'calculator' | 'community'>('content');
  
  // Calculator State
  const [initialInvestment, setInitialInvestment] = useState(100000);
  const [monthlyContribution, setMonthlyContribution] = useState(10000);
  const [expectedYield, setExpectedYield] = useState(15);
  const [tenure, setTenure] = useState(5);
  const [newIdea, setNewIdea] = useState('');

  const calculatorData = useMemo(() => {
    const data = [];
    let balanceNoRedeploy = initialInvestment;
    let balanceRedeploy = initialInvestment;
    const monthlyYield = expectedYield / 100 / 12;

    for (let month = 0; month <= tenure * 12; month++) {
      if (month % 12 === 0 || month === tenure * 12) {
        data.push({
          year: `Year ${month / 12}`,
          'Without Redeployment': Math.round(balanceNoRedeploy),
          'With Redeployment': Math.round(balanceRedeploy)
        });
      }

      // Logic: 
      // Without redeploy: interest is calculated but "spent" (not added to principal)
      // With redeploy: interest is added to principal (compounding)
      const interestThisMonthNoRedeploy = balanceNoRedeploy * monthlyYield; 
      // Actually "Without Redeployment" means simple interest or fixed payouts that aren't reinvested.
      // But usually, the principal stays the same or grows only by monthly contributions.
      
      balanceNoRedeploy += monthlyContribution;
      // The total value "without redeploy" would be Initial + Sum(monthy) + Sum(interest) if kept in cash.
      // Let's assume balanceNoRedeploy is just Principal + Payouts (but payouts don't earn more interest).
      
      // With redeploy (Compound):
      balanceRedeploy = (balanceRedeploy + monthlyContribution) * (1 + monthlyYield);
    }
    
    // Recalculate "Without Redeployment" for a fair comparison:
    let runningPayouts = 0;
    let runningPrincipal = initialInvestment;
    for (let month = 1; month <= tenure * 12; month++) {
        runningPrincipal += monthlyContribution;
        runningPayouts += (runningPrincipal * monthlyYield);
    }
    
    // Simplified for chart display
    const finalData = [];
    let pNo = initialInvestment;
    let pYes = initialInvestment;
    let totalPayouts = 0;

    for (let y = 0; y <= tenure; y++) {
        const m = y * 12;
        // Approximation for the chart
        if (m === 0) {
            finalData.push({ year: 'Y0', 'Without Redeployment': initialInvestment, 'With Redeployment': initialInvestment });
            continue;
        }
        
        // Compound
        pYes = initialInvestment * Math.pow(1 + expectedYield/100, y) + 
               monthlyContribution * 12 * ((Math.pow(1 + expectedYield/100, y) - 1) / (expectedYield/100));

        // Simple (payouts stored in non-interest bearing account)
        pNo = (initialInvestment + (monthlyContribution * 12 * y)) + 
              (initialInvestment * (expectedYield/100) * y) + 
              (monthlyContribution * 12 * (y * (y-1) / 2) * (expectedYield/100));

        finalData.push({
            year: `Year ${y}`,
            'Without Redeployment': Math.round(pNo),
            'With Redeployment': Math.round(pYes)
        });
    }

    return finalData;
  }, [initialInvestment, monthlyContribution, expectedYield, tenure]);

  return (
    <div className="space-y-10">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif italic text-natural-text mb-2">Alpha Insights</h1>
          <p className="text-natural-muted font-medium">Market trends, expert views, and portfolio tools.</p>
        </div>
        
        <div className="flex bg-natural-surface p-1 rounded-full border border-natural-border shadow-inner">
          {(['content', 'calculator', 'community'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab 
                ? 'bg-white text-natural-primary shadow-sm' 
                : 'text-natural-muted hover:text-natural-text'
              }`}
            >
              {tab === 'content' ? 'News & Blogs' : tab === 'calculator' ? 'Calculator' : 'Community'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-10">
          
          {activeTab === 'content' && (
            <>
              {/* Featured News */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-natural-surface rounded-lg">
                    <Newspaper size={20} className="text-natural-primary" />
                  </div>
                  <h2 className="text-2xl font-serif italic font-bold">Latest Alpha News</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockNews.map(item => (
                    <motion.div 
                      key={item.id}
                      whileHover={{ y: -4 }}
                      className="bg-white border border-natural-border rounded-2xl overflow-hidden shadow-sm group cursor-pointer"
                    >
                      <div className="h-40 relative overflow-hidden">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-bold uppercase tracking-wider text-natural-primary">{item.category}</div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold text-natural-muted uppercase tracking-widest">
                          <span>{item.source}</span>
                          <span>{item.time}</span>
                        </div>
                        <h3 className="font-bold text-natural-text leading-tight group-hover:text-natural-primary transition-colors">{item.title}</h3>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Blogs */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-natural-surface rounded-lg">
                    <BookOpen size={20} className="text-natural-primary" />
                  </div>
                  <h2 className="text-2xl font-serif italic font-bold">Exclusive Blogs</h2>
                </div>
                
                <div className="space-y-6">
                  {mockBlogs.map(blog => (
                    <motion.div 
                      key={blog.id}
                      whileHover={{ x: 4 }}
                      className="flex flex-col md:flex-row gap-6 bg-white p-4 rounded-2xl border border-natural-border group cursor-pointer"
                    >
                      <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0">
                        <img src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex flex-col justify-center gap-2">
                        <div className="flex items-center gap-4 text-[10px] font-bold text-natural-muted uppercase tracking-widest">
                          <span>{blog.author}</span>
                          <span className="w-1 h-1 bg-natural-border rounded-full" />
                          <span>{blog.date}</span>
                          <span className="w-1 h-1 bg-natural-border rounded-full" />
                          <span>{blog.readTime}</span>
                        </div>
                        <h3 className="text-xl font-bold text-natural-text group-hover:text-natural-primary transition-colors">{blog.title}</h3>
                        <p className="text-xs text-natural-muted line-clamp-2 leading-relaxed">{blog.excerpt}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === 'calculator' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl border border-natural-border p-8 shadow-sm space-y-8"
            >
              <div className="flex items-center gap-3 border-b border-natural-surface pb-6">
                <Calculator className="text-natural-primary" size={24} />
                <h2 className="text-2xl font-serif italic font-bold">Alpha Redeployment Calculator</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">Initial Investment (₹)</label>
                    <input 
                      type="number" 
                      value={initialInvestment}
                      onChange={(e) => setInitialInvestment(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-xl font-bold text-natural-text focus:outline-none focus:border-natural-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">Monthly Contribution (₹)</label>
                    <input 
                      type="number" 
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-xl font-bold text-natural-text focus:outline-none focus:border-natural-primary"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/2 space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">Expected Yield (%)</label>
                      <input 
                        type="number" 
                        value={expectedYield}
                        onChange={(e) => setExpectedYield(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-xl font-bold text-natural-text focus:outline-none focus:border-natural-primary"
                      />
                    </div>
                    <div className="w-1/2 space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">Tenure (Years)</label>
                      <input 
                        type="number" 
                        value={tenure}
                        onChange={(e) => setTenure(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-xl font-bold text-natural-text focus:outline-none focus:border-natural-primary"
                      />
                    </div>
                  </div>

                  <div className="bg-natural-surface p-4 rounded-xl flex items-start gap-3">
                    <Info size={16} className="text-natural-primary mt-0.5 shrink-0" />
                    <p className="text-[10px] text-natural-muted leading-relaxed italic uppercase font-medium">
                      Redeployment assumes all monthly payouts are immediately reinvested into assets with the same yield.
                    </p>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="bg-natural-surface rounded-2xl p-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-1">Final Corpus (With Redeploy)</div>
                      <div className="text-3xl font-bold text-natural-primary">₹{calculatorData[calculatorData.length-1]['With Redeployment'].toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-1">Difference Created</div>
                      <div className="text-xl font-bold text-green-600">
                        +₹{(calculatorData[calculatorData.length-1]['With Redeployment'] - calculatorData[calculatorData.length-1]['Without Redeployment']).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-natural-border mt-6">
                    <button className="w-full bg-natural-primary text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-natural-primary/90 transition-all">
                      Auto-Redeploy My Portfolio
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={calculatorData}>
                    <defs>
                      <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#5A5A40" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="year" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#7A786F' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#7A786F' }}
                      tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E5E2D9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`}
                    />
                    <Legend iconType="circle" />
                    <Area 
                      type="monotone" 
                      dataKey="With Redeployment" 
                      stroke="#5A5A40" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorWith)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Without Redeployment" 
                      stroke="#7A786F" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'community' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Share Idea */}
              <div className="bg-natural-text text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <h2 className="text-2xl font-serif italic">Share an Anonymous Idea</h2>
                  <p className="text-sm opacity-70">Have a thesis on an asset class? Share it with the community without revealing your identity.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      placeholder="Start typing your thesis..."
                      value={newIdea}
                      onChange={(e) => setNewIdea(e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none focus:bg-white/20 transition-all text-sm"
                    />
                    <button className="bg-white text-natural-text px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-natural-surface transition-all">Submit Idea</button>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              </div>

              {/* Community Ideas List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-natural-muted">Investor Sentiments</h3>
                  <div className="flex items-center gap-4">
                    <button className="text-[10px] font-bold uppercase text-natural-primary">Newest</button>
                    <button className="text-[10px] font-bold uppercase text-natural-muted">Trending</button>
                  </div>
                </div>
                
                {mockIdeas.map(idea => (
                  <div key={idea.id} className="bg-white border border-natural-border p-6 rounded-2xl flex gap-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button className="p-2 hover:bg-natural-surface rounded-lg transition-colors text-natural-muted hover:text-natural-primary">
                        <ArrowUpRight size={18} className="-rotate-45" />
                      </button>
                      <span className="text-xs font-bold">{idea.upvotes}</span>
                    </div>
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-natural-surface rounded text-[8px] font-bold uppercase tracking-widest text-natural-muted">{idea.category}</span>
                        <span className="text-[10px] text-natural-muted font-medium italic">{idea.time}</span>
                      </div>
                      <p className="text-sm font-medium text-natural-text leading-relaxed">{idea.content}</p>
                      <div className="flex items-center gap-4 pt-2">
                        <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-natural-muted hover:text-natural-primary transition-colors">
                          <MessageSquare size={14} /> Discuss
                        </button>
                        <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-natural-muted hover:text-natural-primary transition-colors">
                          <ThumbsUp size={14} /> Respect
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          {/* Badges Section */}
          <div className="bg-white border border-natural-border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Award className="text-natural-primary" size={20} />
              <h3 className="font-serif italic font-bold text-lg">My Badges</h3>
            </div>
            
            <div className="space-y-4">
              {mockBadges.map(badge => (
                <div key={badge.id} className={`p-4 rounded-xl border flex gap-4 ${badge.unlocked ? 'bg-natural-surface border-natural-border' : 'bg-white border-dashed border-natural-border opacity-60'}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${badge.unlocked ? 'bg-natural-primary text-white shadow-lg shadow-natural-primary/20' : 'bg-natural-surface text-natural-muted'}`}>
                    {badge.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-natural-text flex items-center gap-2">
                      {badge.name}
                      {badge.unlocked && <div className="w-1.5 h-1.5 bg-natural-primary rounded-full" />}
                    </h4>
                    <p className="text-[10px] text-natural-muted font-medium mt-0.5 leading-tight">{badge.description}</p>
                    {!badge.unlocked && badge.progress !== undefined && (
                      <div className="mt-2 w-full bg-natural-surface h-1 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-natural-primary" 
                          style={{ width: `${badge.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-natural-muted hover:text-natural-primary transition-colors inline-flex items-center justify-center gap-1">
              View All Badges <ChevronRight size={14} />
            </button>
          </div>

          {/* Expert Quotes */}
          <div className="bg-natural-surface rounded-3xl p-6 border border-natural-border relative overflow-hidden">
             <div className="relative z-10">
                <div className="text-[32px] font-serif text-natural-primary opacity-20 absolute -top-4 -left-2">"</div>
                <p className="text-sm font-serif italic text-natural-text leading-relaxed relative z-10 pl-2">
                  The best time to plant a tree was 20 years ago. The second best time is now. In alternate assets, the best time is before the crowd notices.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-natural-border overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop" alt="Expert" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-natural-text">Rohan Mehta</div>
                    <div className="text-[8px] font-medium uppercase tracking-widest text-natural-muted italic">Asset Strategist, Afinue</div>
                  </div>
                </div>
             </div>
          </div>
          
          {/* Market Pulse */}
          <div className="bg-white border border-natural-border rounded-3xl p-6 shadow-sm">
             <h3 className="font-serif italic font-bold text-lg mb-6">Market Pulse</h3>
             <div className="space-y-6">
                {[
                  { label: 'Real Estate Sentiment', value: 'Bullish', color: 'text-green-600' },
                  { label: 'Collectibles Liquidity', value: 'Moderate', color: 'text-orange-500' },
                  { label: 'Asset Leasing Demand', value: 'High', color: 'text-green-600' }
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center pb-4 border-b border-natural-surface last:border-0 last:pb-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">{item.label}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.value}</span>
                  </div>
                ))}
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
