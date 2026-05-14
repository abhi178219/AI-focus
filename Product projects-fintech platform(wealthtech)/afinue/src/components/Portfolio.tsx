import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, TrendingUp, Wallet, ArrowUpRight, ChevronRight, X, Info, Download, Filter, Calendar, ArrowDownRight, Check } from 'lucide-react';
import { UserInvestment, Transaction, InvestmentClass } from '../types';

const mockInvestments: UserInvestment[] = [
  {
    id: 'inv1',
    dealId: '1',
    dealTitle: 'Electric Bus Fleet - Series 4',
    category: 'Asset Leasing',
    amount: 500000,
    currentValue: 540000,
    returns: '16% IRR',
    status: 'Active',
    dateInvested: '2025-10-15',
    expectedPayouts: [
      { date: '2026-05-10', amount: 15000, type: 'Interest' },
      { date: '2026-05-14', amount: 15000, type: 'Interest' },
      { date: '2026-06-15', amount: 15000, type: 'Interest' },
      { date: '2026-07-15', amount: 15000, type: 'Interest' },
      { date: '2026-08-15', amount: 15000, type: 'Interest' },
      { date: '2026-09-15', amount: 15000, type: 'Interest' },
      { date: '2027-10-15', amount: 500000, type: 'Principal' },
    ]
  },
  {
    id: 'inv2',
    dealId: '2',
    dealTitle: 'Gated Community - Bangalore North',
    category: 'Real Estate',
    amount: 700000,
    currentValue: 752000,
    returns: '14% IRR',
    status: 'Active',
    dateInvested: '2026-01-20',
  },
  {
    id: 'inv3',
    dealId: '3',
    dealTitle: '1960s Highland Park Scotch',
    category: 'Collectibles',
    amount: 45000,
    currentValue: 48500,
    returns: '18% IRR',
    status: 'Active',
    dateInvested: '2026-03-05',
  },
  {
    id: 'inv4',
    dealId: 'old1',
    dealTitle: 'Commercial Rooftop Solar - Phase 2',
    category: 'Asset Leasing',
    amount: 300000,
    currentValue: 365000,
    returns: '15.5% IRR',
    status: 'Matured',
    dateInvested: '2024-05-10',
  },
  {
    id: 'inv5',
    dealId: 'old2',
    dealTitle: 'Warehouse Logistics Fund',
    category: 'Real Estate',
    amount: 1000000,
    currentValue: 1180000,
    returns: '12.8% IRR',
    status: 'Matured',
    dateInvested: '2024-08-15',
  }
];

const mockTransactions: Transaction[] = [
  { id: 'tx1', date: '2026-05-10', dealTitle: 'Electric Bus Fleet', type: 'Payout', amount: 15000, status: 'Successful', assetClass: 'Asset Leasing' },
  { id: 'tx2', date: '2026-04-28', dealTitle: 'Referral Bonus', type: 'Credit', amount: 2500, status: 'Successful', assetClass: 'Corporate Debt' },
  { id: 'tx3', date: '2026-03-05', dealTitle: 'Highland Park Scotch', type: 'Investment', amount: 45000, status: 'Successful', assetClass: 'Collectibles' },
  { id: 'tx4', date: '2026-01-20', dealTitle: 'Gated Community', type: 'Investment', amount: 700000, status: 'Successful', assetClass: 'Real Estate' },
];

export default function Portfolio() {
  const [activeSubTab, setActiveSubTab] = useState<'portfolio' | 'transactions' | 'closed'>('portfolio');
  const [selectedInvestment, setSelectedInvestment] = useState<UserInvestment | null>(null);
  const [showAllPayouts, setShowAllPayouts] = useState(false);
  const [isAlphaModalOpen, setIsAlphaModalOpen] = useState(false);
  const [showAlphaDetails, setShowAlphaDetails] = useState(false);
  const [isAlphaActive, setIsAlphaActive] = useState(false);
  const [txFilter, setTxFilter] = useState({ asset: 'All', type: 'All' });

  // Reset showAllPayouts when investment changes
  React.useEffect(() => {
    setShowAllPayouts(false);
  }, [selectedInvestment]);

  const totalInvested = mockInvestments.reduce((acc, inv) => acc + inv.amount, 0);
  const totalCurrentValue = mockInvestments.reduce((acc, inv) => acc + inv.currentValue, 0);
  const totalGain = totalCurrentValue - totalInvested;
  const gainPercentage = (totalGain / totalInvested) * 100;

  const filteredTransactions = mockTransactions.filter(tx => {
    const matchesAsset = txFilter.asset === 'All' || tx.assetClass === txFilter.asset;
    const matchesType = txFilter.type === 'All' || tx.type === txFilter.type;
    return matchesAsset && matchesType;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Sub-tabs Navigation */}
      <div className="flex gap-8 border-b border-natural-border pb-4">
        <button 
          onClick={() => setActiveSubTab('portfolio')}
          className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeSubTab === 'portfolio' ? 'text-natural-primary' : 'text-natural-muted hover:text-natural-text'}`}
        >
          Portfolio Summary
          {activeSubTab === 'portfolio' && <motion.div layoutId="subtab" className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-natural-primary" />}
        </button>
        <button 
          onClick={() => setActiveSubTab('transactions')}
          className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeSubTab === 'transactions' ? 'text-natural-primary' : 'text-natural-muted hover:text-natural-text'}`}
        >
          Transaction History
          {activeSubTab === 'transactions' && <motion.div layoutId="subtab" className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-natural-primary" />}
        </button>
        <button 
          onClick={() => setActiveSubTab('closed')}
          className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeSubTab === 'closed' ? 'text-natural-primary' : 'text-natural-muted hover:text-natural-text'}`}
        >
          Closed Deals
          {activeSubTab === 'closed' && <motion.div layoutId="subtab" className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-natural-primary" />}
        </button>
      </div>

      {activeSubTab === 'portfolio' ? (
        <>
          {/* Header Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-[32px] border border-natural-border"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-2">Principal</div>
              <div className="text-2xl font-serif font-bold text-natural-text">₹{totalInvested.toLocaleString()}</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-[32px] border border-natural-border"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-2">Expected IRR</div>
              <div className="text-2xl font-serif font-bold text-natural-primary italic">15.8%</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-[32px] border border-natural-border"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-2">Net Earned</div>
              <div className="text-2xl font-serif font-bold text-green-600">₹{totalGain.toLocaleString()}</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-natural-text p-6 rounded-[32px] text-white"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Reinvested Alpha</div>
              <div className="text-2xl font-serif font-bold italic">₹1.2L <span className="text-xs opacity-60 font-sans not-italic">Projected</span></div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif italic text-natural-text">Active Holdings</h2>
              </div>

              <div className="space-y-4">
                {mockInvestments.map((inv) => (
                  <motion.div
                    key={inv.id}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedInvestment(inv)}
                    className="bg-white p-6 rounded-[24px] border border-natural-border flex items-center justify-between group cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-natural-surface rounded-2xl flex items-center justify-center text-natural-primary group-hover:bg-natural-primary group-hover:text-white transition-colors">
                        <TrendingUp size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-natural-text group-hover:text-natural-primary transition-colors">{inv.dealTitle}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mt-1">{inv.category} • {inv.returns}</p>
                      </div>
                    </div>
                    
                    <div className="text-right flex items-center gap-6">
                      <div className="hidden sm:block text-right">
                        <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-0.5">Holdings</div>
                        <div className="text-sm font-bold text-natural-text">₹{inv.currentValue.toLocaleString()}</div>
                      </div>
                      <div className="hidden md:block text-right">
                        <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-0.5">XIRR</div>
                        <div className="text-sm font-bold text-natural-primary italic font-serif">{inv.returns}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-natural-border flex items-center justify-center text-natural-muted group-hover:border-natural-primary group-hover:text-natural-primary transition-all">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[32px] border border-natural-border">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-serif italic text-natural-text">Alpha Simulator</h2>
                  {isAlphaActive && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[9px] font-bold uppercase tracking-widest border border-green-200">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-natural-muted leading-relaxed mb-6">
                  {isAlphaActive 
                    ? "Your payouts are being queued for reinvestment into high-yield Asset Leasing deals." 
                    : "What if you reinvest all payouts into subsequent 16% IRR Asset Leasing deals?"}
                </p>
                <div className="space-y-6">
                  <div className="p-4 bg-natural-surface rounded-2xl border border-natural-border">
                    <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">Portfolio in 3 Years</div>
                    <div className="text-2xl font-serif font-bold text-natural-text italic">₹24,80,000</div>
                    <div className="text-[10px] font-bold text-green-600 mt-1">+₹12.35L Compounded</div>
                  </div>
                  
                  {isAlphaActive ? (
                    <div className="space-y-3">
                      <button 
                        onClick={() => { setShowAlphaDetails(true); setIsAlphaModalOpen(true); }}
                        className="w-full py-3 bg-natural-text text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-natural-text/90 transition-all font-sans"
                      >
                        View More Details
                      </button>
                      <button 
                        onClick={() => setIsAlphaActive(false)}
                        className="w-full py-3 border border-natural-border text-natural-muted rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-natural-surface hover:text-natural-text transition-all font-sans"
                      >
                        Cancel Reinvestment
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setShowAlphaDetails(false); setIsAlphaModalOpen(true); }}
                      className="w-full py-3 bg-natural-primary text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-natural-primary/20 hover:bg-natural-primary/90 transition-all"
                    >
                      Enable Auto-Alpha
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : activeSubTab === 'transactions' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <h2 className="text-2xl font-serif italic text-natural-text">Historical Transactions</h2>
            <div className="flex gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-natural-muted" size={14} />
                <select 
                  className="pl-8 pr-4 py-2 bg-white border border-natural-border rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none"
                  onChange={(e) => setTxFilter({...txFilter, asset: e.target.value})}
                >
                  <option value="All">All Assets</option>
                  <option value="Asset Leasing">Leasing</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Collectibles">Collectibles</option>
                </select>
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-natural-muted" size={14} />
                <select 
                  className="pl-8 pr-4 py-2 bg-white border border-natural-border rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none"
                  onChange={(e) => setTxFilter({...txFilter, type: e.target.value})}
                >
                  <option value="All">All Types</option>
                  <option value="Investment">Investment</option>
                  <option value="Payout">Payout</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-natural-border overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-natural-surface border-b border-natural-border">
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-natural-muted">Date</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-natural-muted">Description</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-natural-muted">Asset Class</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-natural-muted text-right">Amount</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-natural-muted text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-surface">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-natural-surface/30 transition-colors">
                    <td className="px-8 py-4 text-xs font-mono text-natural-muted">{tx.date}</td>
                    <td className="px-8 py-4">
                      <div className="text-sm font-bold text-natural-text">{tx.dealTitle}</div>
                      <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">{tx.type}</div>
                    </td>
                    <td className="px-8 py-4 text-xs font-bold text-natural-muted uppercase tracking-widest">{tx.assetClass}</td>
                    <td className={`px-8 py-4 text-sm font-bold text-right ${tx.type === 'Investment' ? 'text-natural-text' : 'text-natural-primary'}`}>
                      {tx.type === 'Investment' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className={`inline-block px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                        tx.status === 'Successful' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-2xl font-serif italic text-natural-text">Matured Investments</h2>
          <div className="space-y-4">
            {mockInvestments.filter(inv => inv.status === 'Matured').map((inv) => (
              <motion.div
                key={inv.id}
                whileHover={{ y: -4 }}
                className="bg-white p-6 rounded-[24px] border border-natural-border flex items-center justify-between group grayscale hover:grayscale-0 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-natural-surface rounded-2xl flex items-center justify-center text-natural-muted group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <Check size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-natural-text hover:text-natural-primary transition-colors">{inv.dealTitle}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mt-1">{inv.category} • {inv.returns}</p>
                  </div>
                </div>
                
                <div className="text-right flex items-center gap-6">
                  <div className="hidden sm:block text-right">
                    <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-0.5">Final Payout</div>
                    <div className="text-sm font-bold text-natural-text">₹{inv.currentValue.toLocaleString()}</div>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-0.5">Duration</div>
                    <div className="text-sm font-bold text-natural-muted italic font-serif">12 Months</div>
                  </div>
                  <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[9px] font-bold uppercase tracking-widest border border-green-100">
                    Matured
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedInvestment && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvestment(null)}
              className="absolute inset-0 bg-natural-text/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-natural-border"
            >
              <div className="flex flex-col md:flex-row max-h-[90vh] overflow-y-auto">
                <div className="md:w-[40%] bg-natural-surface p-10 border-r border-natural-border space-y-8">
                  <button 
                    onClick={() => setSelectedInvestment(null)}
                    className="p-2 hover:bg-white rounded-full transition-colors mb-4 md:absolute md:top-6 md:left-6"
                  >
                    <ChevronRight size={24} className="rotate-180 text-natural-muted" />
                  </button>
                  
                  <div className="pt-8">
                    <span className="inline-block px-3 py-1 bg-white border border-natural-border rounded-full text-[10px] font-bold uppercase tracking-widest text-natural-primary mb-3">
                      {selectedInvestment.category}
                    </span>
                    <h2 className="text-3xl font-serif font-bold italic text-natural-text leading-tight">
                      {selectedInvestment.dealTitle}
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 bg-white rounded-[24px] border border-natural-border shadow-sm">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-1">Investment Amount</div>
                      <div className="text-2xl font-bold text-natural-text italic font-serif">₹{selectedInvestment.amount.toLocaleString()}</div>
                    </div>
                    <div className="p-5 bg-white rounded-[24px] border border-natural-border shadow-sm">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-1">Total Expected Payout</div>
                      <div className="text-2xl font-bold text-natural-text italic font-serif">₹{(selectedInvestment.expectedPayouts?.reduce((acc, p) => acc + p.amount, 0) || 0).toLocaleString()}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-green-50 rounded-[24px] border border-green-100 shadow-sm">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-green-700/60 mb-1">Received</div>
                        <div className="text-xl font-bold text-green-700 italic font-serif">₹{(selectedInvestment.expectedPayouts?.filter(p => new Date(p.date) < new Date()).reduce((acc, p) => acc + p.amount, 0) || 0).toLocaleString()}</div>
                      </div>
                      <div className="p-5 bg-natural-surface rounded-[24px] border border-natural-border shadow-sm">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-1">Remaining</div>
                        <div className="text-xl font-bold text-natural-text italic font-serif">₹{((selectedInvestment.expectedPayouts?.reduce((acc, p) => acc + p.amount, 0) || 0) - (selectedInvestment.expectedPayouts?.filter(p => new Date(p.date) < new Date()).reduce((acc, p) => acc + p.amount, 0) || 0)).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="p-5 bg-white rounded-[24px] border border-natural-border shadow-sm">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-1">Current IRR</div>
                      <div className="text-2xl font-bold text-natural-primary italic font-serif">16.42%</div>
                      <div className="text-[9px] font-bold text-green-600 mt-1 uppercase">↑ 0.42% Beat Estimates</div>
                    </div>
                  </div>
                </div>

                <div className="md:w-[60%] p-10 space-y-10">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-natural-text border-b border-natural-border pb-2 mb-6">Payout Schedule</h3>
                    <div className="space-y-4">
                      {(showAllPayouts 
                        ? selectedInvestment.expectedPayouts 
                        : selectedInvestment.expectedPayouts?.slice(0, 3)
                      )?.map((payout, i) => {
                        const payoutDate = new Date(payout.date);
                        const today = new Date();
                        const isPast = payoutDate < today;
                        const isToday = payoutDate.toDateString() === today.toDateString();
                        const inProgress = !isPast && (payoutDate.getTime() - today.getTime()) < (3 * 24 * 60 * 60 * 1000);
                        
                        let status = 'Upcoming';
                        let statusStyle = 'bg-white text-natural-muted border-natural-border';
                        
                        if (isPast) {
                          status = 'Paid';
                          statusStyle = 'bg-green-100 text-green-700 border-green-200';
                        } else if (inProgress || isToday) {
                          status = 'In Progress';
                          statusStyle = 'bg-orange-100 text-orange-700 border-orange-200 animate-pulse';
                        }

                        return (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={i} 
                            className="flex items-center justify-between p-4 bg-natural-surface rounded-2xl hover:bg-natural-surface/70 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-natural-primary border border-natural-border">
                                {payout.type === 'Interest' ? <TrendingUp size={18} /> : <Wallet size={18} />}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-natural-text">₹{payout.amount.toLocaleString()}</div>
                                <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">{payout.type} • {payout.date}</div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${statusStyle}`}>
                              {status}
                            </span>
                          </motion.div>
                        );
                      }) || <p className="text-sm italic text-natural-muted">Payout schedule data coming soon.</p>}
                      
                      {!showAllPayouts && (selectedInvestment.expectedPayouts?.length || 0) > 3 && (
                        <button 
                          onClick={() => setShowAllPayouts(true)}
                          className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-natural-primary hover:bg-natural-surface rounded-2xl border border-dashed border-natural-border transition-all"
                        >
                          View More Payouts ({(selectedInvestment.expectedPayouts?.length || 0) - 3} Total)
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-natural-text border-b border-natural-border pb-2 mb-6">Asset Health</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Check className="text-green-600" size={16} />
                        <span className="text-xs font-bold text-natural-text">Asset Tracked & Verified</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Check className="text-green-600" size={16} />
                        <span className="text-xs font-bold text-natural-text">Insurance Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button className="flex-1 bg-natural-primary text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-natural-primary/20">
                      Export Payout Schedule
                    </button>
                    <button className="flex-1 border border-natural-border text-natural-text py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-natural-surface">
                      Exit Opportunity
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Auto-Alpha Configuration Modal */}
      <AutoAlphaModal 
        isOpen={isAlphaModalOpen} 
        onClose={() => setIsAlphaModalOpen(false)}
        showDetails={showAlphaDetails}
        setShowDetails={setShowAlphaDetails}
        isActive={isAlphaActive}
        onActivate={() => setIsAlphaActive(true)}
      />

    </div>
  );
}

function AutoAlphaModal({ 
  isOpen, 
  onClose, 
  showDetails, 
  setShowDetails,
  isActive,
  onActivate
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  showDetails: boolean;
  setShowDetails: (v: boolean) => void;
  isActive: boolean;
  onActivate: () => void;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-natural-text/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-natural-border p-10"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-natural-surface rounded-3xl flex items-center justify-center text-natural-primary mx-auto mb-6">
              <TrendingUp size={32} />
            </div>
            <h2 className="text-3xl font-serif font-bold italic text-natural-text mb-2">
              {isActive ? "Alpha Active" : "Configure Auto-Alpha"}
            </h2>
            <p className="text-sm text-natural-muted font-medium">Maximize your returns through automated reinvestment</p>
          </div>

          {!showDetails ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-natural-surface rounded-3xl border border-natural-border">
                  <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">Monthly Payout</div>
                  <div className="text-2xl font-serif font-bold text-natural-text">₹24,500</div>
                </div>
                <div className="p-6 bg-natural-surface rounded-3xl border border-natural-border">
                  <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">Total Deal Payout</div>
                  <div className="text-2xl font-serif font-bold text-natural-text">₹8,82,000</div>
                </div>
              </div>

              <div className="bg-natural-text/5 p-6 rounded-3xl border border-natural-border/50">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-natural-text mb-3 flex items-center gap-2">
                  <Info size={14} className="text-natural-primary" /> The Alpha Strategy
                </h3>
                <p className="text-[13px] text-natural-muted leading-relaxed">
                  By enabling Auto-Alpha, your monthly interest payouts are automatically queued for the next available Asset Leasing or Real Estate deal. This compounding effect can increase your overall portfolio IRR by <span className="text-natural-primary font-bold">additional 2-4%</span>.
                </p>
              </div>

              {isActive ? (
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center gap-2 text-green-700 font-bold text-xs uppercase tracking-widest">
                  <Check size={16} /> Strategy Enabled
                </div>
              ) : (
                <button 
                  onClick={() => { onActivate(); setShowDetails(true); }}
                  className="w-full py-4 bg-natural-primary text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-natural-primary/30 hover:bg-natural-primary/90 transition-all font-sans"
                >
                  Confirm & Enable Reinvestment
                </button>
              )}

              <div className="flex justify-between items-center px-4">
                <button onClick={onClose} className="text-[10px] font-bold uppercase tracking-widest text-natural-muted hover:text-natural-text transition-colors">Cancel</button>
                <button onClick={() => setShowDetails(true)} className="text-[10px] font-bold uppercase tracking-widest text-natural-primary hover:underline underline-offset-4">View More Details</button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-natural-muted border-b border-natural-border pb-2">Projected Cashflow Details</h3>
                <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {[1,2,3,4,5,6].map(m => (
                    <div key={m} className="flex justify-between items-center text-sm">
                      <span className="text-natural-muted font-medium">Month {m} Payout Reinvestment</span>
                      <span className="font-bold text-natural-text tracking-tight">₹24,500 @ 16% IRR</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                    <div className="text-[9px] font-bold text-green-700 uppercase tracking-widest mb-1">Standard Returns</div>
                    <div className="text-lg font-bold text-green-800">₹8.82L</div>
                 </div>
                 <div className="p-4 bg-natural-primary/10 rounded-2xl border border-natural-primary/20">
                    <div className="text-[9px] font-bold text-natural-primary uppercase tracking-widest mb-1">Alpha Returns</div>
                    <div className="text-lg font-bold text-natural-primary">₹11.24L</div>
                 </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDetails(false)}
                  className="flex-1 py-4 border border-natural-border rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-natural-surface"
                >
                  Back
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-natural-primary text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-natural-primary/90"
                >
                  Redirect to Holdings
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
