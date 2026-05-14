import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Share2, Copy, Gift, Users, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import { ReferralStats } from '../types';

const mockReferralStats: ReferralStats = {
  code: 'AFINUE777',
  totalEarned: 15000,
  successfulReferrals: 12,
  pendingReferrals: 4,
  history: [
    { id: '1', userName: 'Sarah Jenkins', date: '2026-04-12', reward: 2500, status: 'Completed' },
    { id: '2', userName: 'Michael Chen', date: '2026-04-28', reward: 2500, status: 'Completed' },
    { id: '3', userName: 'Anjali Sharma', date: '2026-05-02', reward: 0, status: 'Pending' },
    { id: '4', userName: 'David Miller', date: '2026-05-10', reward: 2500, status: 'Completed' },
  ]
};

export default function ReferAndEarn() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://afinue.com/join?ref=${mockReferralStats.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <div className="bg-natural-primary rounded-[40px] p-12 text-natural-bg relative overflow-hidden shadow-2xl shadow-natural-primary/20">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-white/10 backdrop-blur-sm border border-white/20 mb-6 font-primary text-white">
            Refer & Prosper
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold italic mb-6 leading-tight">
            Share the Wealth. <br />
            Earn Rewards.
          </h1>
          <p className="text-lg opacity-80 mb-10 leading-relaxed font-medium">
            Give your friends a head start in alternate investing. When they make their first investment, 
            you both earn ₹2,500 in platform credit.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-1 flex items-center">
              <span className="flex-1 px-6 font-serif font-bold text-2xl italic tracking-widest">{mockReferralStats.code}</span>
              <button 
                onClick={handleCopy}
                className="bg-white text-natural-primary px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-natural-surface transition-all flex items-center gap-2"
              >
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button className="px-8 py-4 bg-white/10 rounded-full border border-white/30 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
              <Share2 size={18} />
              Share Link
            </button>
          </div>
        </div>
        
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 right-10 w-64 h-64 border border-white/10 rounded-full translate-y-1/3" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Gift, label: 'Total Rewards Earned', val: `₹${mockReferralStats.totalEarned.toLocaleString()}`, color: 'text-natural-primary' },
          { icon: Users, label: 'Successful Referrals', val: mockReferralStats.successfulReferrals, color: 'text-natural-text' },
          { icon: CreditCard, label: 'Pending Rewards', val: `₹${(mockReferralStats.pendingReferrals * 2500).toLocaleString()}`, color: 'text-natural-muted' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[32px] border border-natural-border shadow-sm"
          >
            <div className="w-12 h-12 bg-natural-surface rounded-2xl flex items-center justify-center text-natural-primary mb-6">
              <stat.icon size={24} />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-2">{stat.label}</div>
            <div className={`text-4xl font-serif font-bold ${stat.color}`}>{stat.val}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Referral History */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-serif italic text-natural-text">Referral History</h2>
          <div className="bg-white rounded-[32px] border border-natural-border overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-natural-surface border-b border-natural-border">
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-natural-muted">Friend</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-natural-muted">Date</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-natural-muted text-right">Reward</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-natural-muted text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-surface">
                {mockReferralStats.history.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-8 py-4 text-sm font-bold text-natural-text">{entry.userName}</td>
                    <td className="px-8 py-4 text-sm text-natural-muted font-medium">{entry.date}</td>
                    <td className="px-8 py-4 text-sm font-bold text-natural-primary text-right">
                      {entry.reward > 0 ? `+₹${entry.reward.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        entry.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reward Structure */}
        <div className="bg-white p-8 rounded-[32px] border border-natural-border h-fit">
          <h2 className="text-xl font-serif italic text-natural-text mb-6">How it works</h2>
          <div className="space-y-8">
            {[
              { icon: Share2, title: 'Send Invitation', desc: 'Share your unique link or code with friends.' },
              { icon: Sparkles, title: 'Friend Invests', desc: 'They complete their first investment of ₹25,000+.' },
              { icon: Gift, title: 'Earn Credits', desc: 'Both you and your friend get ₹2,500 credited instantly.' },
            ].map((step, i) => (
              <div key={step.title} className="flex gap-4">
                <div className="shrink-0 w-8 h-8 bg-natural-surface rounded-full flex items-center justify-center text-natural-primary text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-natural-text uppercase tracking-widest mb-1">{step.title}</h4>
                  <p className="text-[11px] text-natural-muted font-medium leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-10 p-5 bg-natural-surface rounded-2xl border border-natural-border">
            <p className="text-[10px] text-natural-muted leading-relaxed italic font-medium">
              * Credits can be used for your next investment. Maximum 50 successful referrals per calendar year.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
