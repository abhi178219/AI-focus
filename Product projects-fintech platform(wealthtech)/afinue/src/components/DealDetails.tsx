import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Calendar, 
  Wallet, 
  MapPin, 
  Download, 
  Info, 
  ChevronDown, 
  ShieldCheck, 
  Building2, 
  BarChart3, 
  FileText,
  Users,
  ArrowUpRight,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell
} from 'recharts';
import { Deal } from '../types';

interface DealDetailsProps {
  deal: Deal;
  onBack: () => void;
  onSimilarDealClick: (deal: Deal) => void;
}

export default function DealDetails({ deal, onBack, onSimilarDealClick }: DealDetailsProps) {
  const [investmentAmount, setInvestmentAmount] = useState(50000);
  const [activeTab, setActiveTab] = useState<'history' | 'financials' | 'terms' | 'management'>('history');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showPayoutSchedule, setShowPayoutSchedule] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [deal]);

  // Mock calculation for the calculator
  const monthlyReturn = (investmentAmount * (parseFloat(deal.returns) / 100)) / 12;
  const totalReturn = monthlyReturn * parseInt(deal.tenure);

  const faqs = [
    { q: "What is the security for this investment?", a: "The asset is owned by the SPV and leased to the lessee. In case of default, the asset can be repossessed." },
    { q: "How often are the payouts?", a: "Payouts are made on the 5th of every month directly to your bank account." },
    { q: "Can I exit before the tenure ends?", a: "There is no secondary market currently, but you can request an early exit subject to a 2% penalty." },
    { q: "Is the IRR guaranteed?", a: "The returns are pre-defined in the lease agreement, but subject to the performance of the lessee." }
  ];

  const financialStats = [
    { year: '2020', revenue: 85, ebitda: 11.2, margin: 13.2 },
    { year: '2021', revenue: 102, ebitda: 13.8, margin: 13.5 },
    { year: '2022', revenue: 124, ebitda: 17.5, margin: 14.1 },
    { year: '2023', revenue: 142.5, ebitda: 21.1, margin: 14.8 },
  ];

  const similarDeals = [
    {
      id: 'sim-1',
      title: 'Green Energy Solar Farm',
      returns: '14.5%',
      tenure: '48 Mo',
      minInvestment: '₹1,00,000',
      image: 'https://images.unsplash.com/photo-1509391366360-fe5bb65831bb?q=80&w=400&auto=format&fit=crop',
      category: 'Asset Leasing' as const,
      status: 'Open' as const
    },
    {
      id: 'sim-2',
      title: 'Commercial Hub - Sector V',
      returns: '18.0%',
      tenure: '36 Mo',
      minInvestment: '₹5,00,000',
      image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=400&auto=format&fit=crop',
      category: 'Real Estate' as const,
      status: 'Open' as const
    }
  ];

  return (
    <div className="bg-natural-bg">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-12">
          {/* Header Section */}
          <section className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-natural-surface rounded-full text-[10px] font-bold uppercase tracking-widest text-natural-primary">
                {deal.category}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-natural-muted uppercase tracking-widest">
                <MapPin size={10} /> {deal.location}
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold italic text-natural-text mb-6">
              {deal.title}
            </h1>
            <p className="text-natural-muted font-medium text-lg max-w-2xl leading-relaxed">
              {deal.description || "Diversified high-yield investment opportunity with a focus on risk mitigation and consistent cash flow."}
            </p>
          </section>

          {/* Deal Highlights */}
          <section className="bg-white rounded-[32px] p-8 border border-natural-border shadow-sm">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-natural-text mb-8 flex items-center gap-2">
              <TrendingUp size={14} className="text-natural-primary" /> Deal Highlights
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Asset Value</div>
                <div className="text-xl font-bold text-natural-text">₹2.4 Cr</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Target IRR</div>
                <div className="text-xl font-bold text-natural-primary">{deal.returns}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Tenure</div>
                <div className="text-xl font-bold text-natural-text">{deal.tenure}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Payout Cycle</div>
                <div className="text-xl font-bold text-natural-text">Monthly</div>
              </div>
            </div>
          </section>

          {/* Lessee Details (HNI Persona: Data driven tabs) */}
          <section className="space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-natural-text flex items-center gap-2">
              <Building2 size={14} className="text-natural-primary" /> Lessee Details
            </h2>
            <div className="bg-white rounded-[32px] border border-natural-border overflow-hidden">
              <div className="flex border-b border-natural-border overflow-x-auto scrollbar-hide">
                {(['history', 'financials', 'terms', 'management'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-8 py-5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
                      activeTab === tab 
                      ? 'text-natural-primary border-natural-primary bg-natural-surface/30' 
                      : 'text-natural-muted border-transparent hover:text-natural-text'
                    }`}
                  >
                    {tab.replace(/([A-Z])/g, ' $1')}
                  </button>
                ))}
              </div>
              <div className="p-8">
                {activeTab === 'history' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-sm text-natural-muted leading-relaxed">
                      Founded in 2008, the lessee is a leading player in the cold-chain logistics sector. With a presence in 12 major cities and a fleet of over 500 refrigerated trucks, they serve major pharmaceutical and FMCG clients including GlaxoSmithKline and Amul.
                    </p>
                    <p className="text-sm text-natural-muted leading-relaxed">
                      The company has maintained a 22% CAGR over the last 5 years and has a CRISIL rating of BBB+ (Stable).
                    </p>
                  </div>
                )}
                {activeTab === 'financials' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-natural-surface rounded-2xl border border-natural-border/50">
                        <div className="text-[9px] font-bold text-natural-muted uppercase tracking-widest mb-1">Revenue FY23</div>
                        <div className="text-lg font-bold text-natural-text">₹142.5 Cr</div>
                      </div>
                      <div className="p-4 bg-natural-surface rounded-2xl border border-natural-border/50">
                        <div className="text-[9px] font-bold text-natural-muted uppercase tracking-widest mb-1">EBITDA Margin</div>
                        <div className="text-lg font-bold text-natural-text">14.8%</div>
                      </div>
                      <div className="p-4 bg-natural-surface rounded-2xl border border-natural-border/50">
                        <div className="text-[9px] font-bold text-natural-muted uppercase tracking-widest mb-1">Debt/Equity</div>
                        <div className="text-lg font-bold text-natural-text">0.8x</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-natural-muted uppercase tracking-[0.1em]">Revenue & EBITDA (₹ Cr)</h4>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financialStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E2D9" />
                              <XAxis 
                                dataKey="year" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: '#7A786F', fontWeight: 600 }} 
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: '#7A786F', fontWeight: 600 }} 
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#FDFCF8', 
                                  borderRadius: '12px', 
                                  border: '1px solid #E5E2D9',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }} 
                              />
                              <Bar dataKey="revenue" fill="#5A5A40" radius={[4, 4, 0, 0]} name="Revenue" />
                              <Bar dataKey="ebitda" fill="#A5A58D" radius={[4, 4, 0, 0]} name="EBITDA" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-natural-muted uppercase tracking-[0.1em]">EBITDA Margin Trend</h4>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={financialStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E2D9" />
                              <XAxis 
                                dataKey="year" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: '#7A786F', fontWeight: 600 }} 
                              />
                              <YAxis 
                                domain={[12, 16]}
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: '#7A786F', fontWeight: 600 }} 
                                tickFormatter={(val) => `${val}%`}
                              />
                              <Tooltip 
                                formatter={(val) => [`${val}%`, 'Margin']}
                                contentStyle={{ 
                                  backgroundColor: '#FDFCF8', 
                                  borderRadius: '12px', 
                                  border: '1px solid #E5E2D9',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }} 
                              />
                              <Line 
                                type="monotone" 
                                dataKey="margin" 
                                stroke="#5A5A40" 
                                strokeWidth={2} 
                                dot={{ fill: '#5A5A40', strokeWidth: 2, r: 4 }} 
                                activeDot={{ r: 6, strokeWidth: 0 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-xs flex items-start gap-3">
                      <Info size={16} className="shrink-0 mt-0.5" />
                      <p>View detailed audit reports and GST filings in the <span className="font-bold underline cursor-pointer">Downloads Section</span>.</p>
                    </div>
                  </div>
                )}
                {activeTab === 'terms' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between border-b border-natural-border pb-3">
                      <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Lease Commencement</span>
                      <span className="text-sm font-bold text-natural-text">June 2024</span>
                    </div>
                    <div className="flex justify-between border-b border-natural-border pb-3">
                      <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Lock-in Period</span>
                      <span className="text-sm font-bold text-natural-text">36 Months</span>
                    </div>
                    <div className="flex justify-between border-b border-natural-border pb-3">
                      <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Security Deposit</span>
                      <span className="text-sm font-bold text-natural-text">3 Months Lease</span>
                    </div>
                    <div className="flex justify-between border-b border-natural-border pb-3">
                      <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Late Payment Clause</span>
                      <span className="text-sm font-bold text-natural-text">18% p.a.</span>
                    </div>
                  </div>
                )}
                {activeTab === 'management' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {[
                      { name: "Rahul Deshmukh", role: "CEO & Founder", exp: "20+ Yrs, ex-DHL", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
                      { name: "Sneha Kapur", role: "CFO", exp: "15+ Yrs, ex-KPMG", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" }
                    ].map(member => (
                      <div key={member.name} className="flex items-center gap-4 p-4 bg-natural-surface rounded-2xl">
                        <img src={member.img} alt={member.name} className="w-12 h-12 rounded-full object-cover grayscale" />
                        <div>
                          <div className="text-sm font-bold text-natural-text">{member.name}</div>
                          <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">{member.role}</div>
                          <div className="text-[9px] text-natural-muted">{member.exp}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Asset Details Section */}
          <section className="space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-natural-text flex items-center gap-2">
              <BarChart3 size={14} className="text-natural-primary" /> Asset Specifications
            </h2>
            <div className="bg-white rounded-[32px] border border-natural-border p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <p className="text-sm text-natural-muted leading-relaxed">
                    The underlying assets comprise 15 high-performance refrigerated vehicles equipped with advanced thermal monitoring systems. Each unit is customized for pharmaceutical transport requirements.
                  </p>
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <div className="text-[9px] font-bold text-natural-muted uppercase tracking-widest">Manufacturer</div>
                      <div className="text-sm font-bold text-natural-text">Tata Motors / Carrier</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-natural-muted uppercase tracking-widest">Year of Mfg</div>
                      <div className="text-sm font-bold text-natural-text">2024 (Brand New)</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-natural-muted uppercase tracking-widest">Useful Life</div>
                      <div className="text-sm font-bold text-natural-text">8 Years</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-natural-muted uppercase tracking-widest">Salvage Value</div>
                      <div className="text-sm font-bold text-natural-text">₹18 Lakhs</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 min-h-[300px]">
                  <img src="https://images.unsplash.com/photo-1519003722824-18442473318b?w=400&h=300&fit=crop" className="w-full h-full object-cover rounded-2xl grayscale hover:grayscale-0 transition-all duration-700" alt="Asset 1" />
                  <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop" className="w-full h-full object-cover rounded-2xl grayscale hover:grayscale-0 transition-all duration-700" alt="Asset 2" />
                  <img src="https://images.unsplash.com/photo-1590490359854-dfba19688d70?w=600&h=400&fit=crop" className="w-full h-full object-cover rounded-2xl col-span-2 grayscale hover:grayscale-0 transition-all duration-700" alt="Asset 3" />
                </div>
              </div>
            </div>
          </section>

          {/* Risk Details */}
          <section className="bg-natural-surface rounded-[32px] p-8 space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-natural-text flex items-center gap-2">
              <ShieldCheck size={14} className="text-natural-primary" /> Risk Analysis & Mitigation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="text-[10px] font-bold text-red-700 uppercase tracking-widest">Key Risks</div>
                <ul className="space-y-3">
                  <li className="flex gap-2 text-xs text-natural-muted leading-relaxed">
                    <span className="text-red-500 font-bold">•</span>
                    Concentration Risk: High dependency on few large clients in the logistics chain.
                  </li>
                  <li className="flex gap-2 text-xs text-natural-muted leading-relaxed">
                    <span className="text-red-500 font-bold">•</span>
                    Asset Utility: Rapid technological shifts could make specific equipment obsolete.
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <div className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Mitigation Strategy</div>
                <ul className="space-y-3">
                  <li className="flex gap-2 text-xs text-natural-muted leading-relaxed">
                    <span className="text-green-500 font-bold">•</span>
                    Ownership: Asset remains on SPV balance sheet, ensuring easy liquidation.
                  </li>
                  <li className="flex gap-2 text-xs text-natural-muted leading-relaxed">
                    <span className="text-green-500 font-bold">•</span>
                    Insurance: 110% comprehensive insurance cover for all leased assets.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* FAQs */}
          <section className="space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-natural-text flex items-center gap-2">
              <Info size={14} className="text-natural-primary" /> Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-natural-border overflow-hidden">
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="text-sm font-bold text-natural-text italic font-serif tracking-tight">{faq.q}</span>
                    <ChevronDown size={16} className={`text-natural-muted transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-4 text-xs text-natural-muted leading-relaxed animate-in fade-in zoom-in-95 duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Calculator & Actions (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-8">
            {/* Investment Calculator */}
            <div className="bg-white rounded-[32px] p-8 border border-natural-border shadow-xl shadow-natural-primary/5">
              <h3 className="text-xl font-serif italic text-natural-text mb-6">Return Calculator</h3>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Investment Amount</label>
                    <span className="text-lg font-bold text-natural-primary font-sans">₹{investmentAmount.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10000" 
                    max="1000000" 
                    step="10000"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-natural-surface rounded-full appearance-none cursor-pointer accent-natural-primary"
                  />
                  <div className="flex justify-between text-[8px] font-bold text-natural-muted mt-2 uppercase tracking-widest">
                    <span>₹10K</span>
                    <span>₹10L</span>
                  </div>
                </div>

                <div className="p-6 bg-natural-surface rounded-[24px] space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Est. Monthly Return</span>
                    <span className="text-sm font-bold text-natural-text text-green-700">₹{Math.round(monthlyReturn).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest md:max-w-[120px]">Total Gains ({deal.tenure})</span>
                    <span className="text-sm font-bold text-natural-text">₹{Math.round(totalReturn).toLocaleString()}</span>
                  </div>

                  <div className="pt-4 mt-2 border-t border-natural-border/30">
                    <div className="text-[9px] font-bold text-natural-muted uppercase tracking-[0.1em] mb-3">Projected Payout Schedule</div>
                    <div className="space-y-2">
                       {[1, 2, 3].map(month => (
                         <div key={month} className="flex justify-between items-center text-[10px]">
                           <span className="text-natural-muted">Month {month} (Jul '24)</span>
                           <span className="font-bold text-natural-text">₹{Math.round(monthlyReturn).toLocaleString()}</span>
                         </div>
                       ))}
                       <button 
                         onClick={() => setShowPayoutSchedule(true)}
                         className="w-full text-[9px] font-bold text-natural-primary uppercase tracking-widest text-center pt-2 hover:underline cursor-pointer transition-all"
                       >
                         View Full Payout Schedule
                       </button>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-natural-primary text-white py-5 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-natural-primary/20 hover:bg-natural-primary/90 transition-all flex items-center justify-center gap-2 group">
                  Invest in Deal <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Downloads Section */}
            <div className="bg-natural-surface rounded-[32px] p-8 border border-natural-border">
              <h3 className="text-sm font-bold text-natural-text uppercase tracking-widest mb-6 flex items-center gap-2">
                <Download size={16} className="text-natural-primary" /> Documents
              </h3>
              <div className="space-y-4">
                {[
                  { name: "Information Memorandum", size: "2.4 MB", type: "PDF" },
                  { name: "Financial Statements FY23", size: "1.1 MB", type: "PDF" },
                  { name: "Lease Agreement Sample", size: "0.8 MB", type: "PDF" }
                ].map((doc, idx) => (
                  <button key={idx} className="w-full group flex items-center justify-between p-4 bg-white rounded-2xl border border-transparent hover:border-natural-primary transition-all">
                    <div className="flex items-center gap-3 text-left">
                      <FileText size={20} className="text-natural-muted bg-natural-surface p-1 rounded" />
                      <div>
                        <div className="text-xs font-bold text-natural-text truncate max-w-[150px]">{doc.name}</div>
                        <div className="text-[9px] font-bold text-natural-muted uppercase tracking-widest">{doc.type} • {doc.size}</div>
                      </div>
                    </div>
                    <Download size={14} className="text-natural-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Deals Section */}
      <section className="mt-24 pt-24 border-t border-natural-border">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-serif italic text-natural-text mb-2">Similar Opportunities</h2>
            <p className="text-natural-muted font-medium text-sm">You might also be interested in these high-alpha deals.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {similarDeals.map((sim) => (
            <div 
              key={sim.id} 
              onClick={() => onSimilarDealClick(sim as any)}
              className="bg-white rounded-[32px] p-6 border border-natural-border flex gap-6 hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0">
                <img src={sim.image} alt={sim.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="flex flex-col justify-between py-1">
                <div>
                  <div className="text-[9px] font-bold text-natural-primary uppercase tracking-[0.2em] mb-1">{sim.category}</div>
                  <h3 className="text-lg font-serif italic font-bold text-natural-text leading-tight group-hover:text-natural-primary transition-colors">{sim.title}</h3>
                </div>
                <div className="flex gap-6 mt-4">
                  <div>
                    <div className="text-[8px] font-bold text-natural-muted uppercase tracking-widest">Returns</div>
                    <div className="text-xs font-bold text-natural-text">{sim.returns}</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-bold text-natural-muted uppercase tracking-widest">Tenure</div>
                    <div className="text-xs font-bold text-natural-text">{sim.tenure}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Payout Schedule Modal */}
      <AnimatePresence>
        {showPayoutSchedule && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPayoutSchedule(false)}
              className="absolute inset-0 bg-natural-text/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-natural-border flex items-center justify-between bg-natural-bg/50">
                <div>
                  <h3 className="text-2xl font-serif italic text-natural-text">Full Payout Schedule</h3>
                  <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mt-1">Based on ₹{investmentAmount.toLocaleString()} investment</p>
                </div>
                <button 
                  onClick={() => setShowPayoutSchedule(false)}
                  className="p-2 hover:bg-natural-surface rounded-full transition-colors text-natural-muted hover:text-natural-text"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-natural-surface rounded-2xl border border-natural-border/50">
                    <div className="text-[9px] font-bold text-natural-muted uppercase tracking-widest mb-1">Investment</div>
                    <div className="text-xl font-bold text-natural-text">₹{investmentAmount.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-natural-surface rounded-2xl border border-natural-border/50">
                    <div className="text-[9px] font-bold text-natural-muted uppercase tracking-widest mb-1">Monthly Payout</div>
                    <div className="text-xl font-bold text-green-700">₹{Math.round(monthlyReturn).toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-natural-primary rounded-2xl border border-natural-primary shadow-lg shadow-natural-primary/20">
                    <div className="text-[9px] font-bold text-white/70 uppercase tracking-widest mb-1">Total Expected</div>
                    <div className="text-xl font-bold text-white">₹{Math.round(totalReturn + investmentAmount).toLocaleString()}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="grid grid-cols-3 px-4 py-2 bg-natural-surface/50 rounded-t-xl border-x border-t border-natural-border">
                    <div className="text-[9px] font-bold text-natural-muted uppercase tracking-widest">Month</div>
                    <div className="text-[9px] font-bold text-natural-muted uppercase tracking-widest text-center">Date</div>
                    <div className="text-[9px] font-bold text-natural-muted uppercase tracking-widest text-right">Payout</div>
                  </div>
                  <div className="border border-natural-border divide-y divide-natural-border/50 rounded-b-xl overflow-hidden">
                    {Array.from({ length: parseInt(deal.tenure) }).map((_, i) => {
                      const date = new Date(2024, 6 + i, 5); // Starting Jul 2024
                      return (
                        <div key={i} className="grid grid-cols-3 px-4 py-3 hover:bg-natural-surface/30 transition-colors">
                          <div className="text-xs font-bold text-natural-text">Month {i + 1}</div>
                          <div className="text-xs text-natural-muted text-center font-medium">
                            {date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                          </div>
                          <div className="text-xs font-bold text-natural-text text-right">₹{Math.round(monthlyReturn).toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-2xl text-[10px] font-medium leading-relaxed flex gap-3">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <p>The total expected payout includes the principal repayment at the end of the tenure. These figures are indicative and subject to the rental yields defined in the master lease agreement.</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-natural-border bg-natural-bg/30">
                <button 
                  onClick={() => setShowPayoutSchedule(false)}
                  className="w-full bg-natural-primary text-white py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-natural-primary/90 transition-all shadow-lg"
                >
                  Close Schedule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
