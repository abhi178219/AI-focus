import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  CreditCard, 
  AtSign, 
  Phone, 
  ChevronRight, 
  Edit3, 
  CheckCircle2, 
  Upload,
  MessageSquare,
  Mail,
  Headphones,
  Check,
  Info
} from 'lucide-react';
import { User, KYCData } from '../types';

interface ProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

export default function Profile({ user, onUpdateUser }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'kyc' | 'support'>('details');
  const [editForm, setEditForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    address: user.address || ''
  });

  const [kycForm, setKycForm] = useState<Partial<KYCData>>(user.kyc || {
    pan: '',
    aadhar: '',
    isResident: true,
    pepExposure: false,
    employmentStatus: '',
    salaryRange: '',
    bankDetails: {
      accountNumber: '',
      ifsc: '',
      bankName: '',
      accountName: ''
    }
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      address: editForm.address
    });
    setIsEditing(false);
  };

  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let status: 'Under Review' | 'Approved' | 'Rejected' = 'Under Review';
    if (kycForm.pan === '1') status = 'Rejected';
    else if (kycForm.pan === '2') status = 'Approved';
    else if (kycForm.pan === '3') status = 'Under Review';
    
    onUpdateUser({
      ...user,
      kyc: { 
        ...(kycForm as KYCData), 
        status 
      }
    });
  };

  const kycStatus = user.kyc?.status || 'Pending';

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header Profile Info */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between bg-natural-text text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-natural-bg/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-white border border-white/20">
              <UserIcon size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-serif font-bold italic tracking-tight">{user.firstName} {user.lastName}</h1>
              <p className="text-white/60 text-sm font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <AtSign size={14} /> {user.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <span className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
              ID: AFN-{user.firstName.slice(0, 3).toUpperCase()}-2026
            </span>
            <span className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
              kycStatus === 'Approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
              kycStatus === 'Rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
              kycStatus === 'Under Review' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
              'bg-orange-500/20 text-orange-400 border-orange-500/30'
            }`}>
              KYC {kycStatus}
            </span>
          </div>
        </div>
        
        <div className="relative z-10 flex gap-4">
           {!isEditing && (
             <button 
              onClick={() => setIsEditing(true)}
              className="px-6 py-3 bg-white text-natural-text rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-natural-surface transition-all flex items-center gap-2"
             >
               <Edit3 size={14} /> Edit Profile
             </button>
           )}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-natural-primary/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-natural-primary/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-natural-border px-4">
        {[
          { id: 'details', label: 'Profile Details', icon: UserIcon },
          { id: 'kyc', label: 'KYC & Banking', icon: ShieldCheck },
          { id: 'support', label: 'Support & RM', icon: Headphones },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-natural-primary' : 'text-natural-muted hover:text-natural-text'}`}
          >
            <tab.icon size={16} />
            {tab.label}
            {activeTab === tab.id && <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-natural-primary" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="bg-white p-10 rounded-[32px] border border-natural-border space-y-8">
              <h2 className="text-xl font-serif italic text-natural-text">Personal Details</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">First Name</label>
                    <input 
                      type="text" 
                      value={editForm.firstName}
                      disabled={!isEditing}
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-2xl outline-none text-sm font-medium focus:border-natural-primary disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Last Name</label>
                    <input 
                      type="text" 
                      value={editForm.lastName}
                      disabled={!isEditing}
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-2xl outline-none text-sm font-medium focus:border-natural-primary disabled:opacity-60"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Permanent Address</label>
                  <textarea 
                    rows={3}
                    value={editForm.address}
                    disabled={!isEditing}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    placeholder="Enter your detailed address"
                    className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-2xl outline-none text-sm font-medium focus:border-natural-primary disabled:opacity-60 resize-none"
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 py-3 bg-natural-primary text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-natural-primary/20">Save Changes</button>
                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 border border-natural-border rounded-full text-[10px] font-bold uppercase tracking-widest">Cancel</button>
                  </div>
                )}
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-10 rounded-[32px] border border-natural-border">
                <h2 className="text-xl font-serif italic text-natural-text mb-6">Contact Info</h2>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-natural-surface rounded-xl flex items-center justify-center text-natural-muted">
                      <Mail size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Email Address</div>
                      <div className="text-sm font-bold text-natural-text">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-natural-surface rounded-xl flex items-center justify-center text-natural-muted">
                      <Phone size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Mobile Number</div>
                      <div className="text-sm font-bold text-natural-text">{user.mobile}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-natural-surface p-8 rounded-[32px] border border-natural-border">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white rounded-2xl text-natural-primary">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="font-serif italic text-lg text-natural-text">Account Security</h3>
                </div>
                <p className="text-xs text-natural-muted leading-relaxed mb-6">Your account is protected with two-factor authentication. Last login was from Bangalore, IN on May 12, 2026.</p>
                <button className="w-full py-3 bg-white border border-natural-border rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-natural-text hover:text-white transition-all">
                  Change Password
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'kyc' && (
          <motion.div
            key="kyc"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {user.kyc?.status === ('Approved' as string) ? (
              <div className="bg-white p-10 rounded-[32px] border border-natural-border">
                <div className="flex items-center justify-between mb-10">
                   <div>
                    <h2 className="text-2xl font-serif font-bold italic text-natural-text">KYC Information</h2>
                    <p className="text-sm text-green-600 font-bold mt-1">Verified & Active</p>
                   </div>
                   <div className="p-4 bg-green-50 rounded-full text-green-600">
                    <ShieldCheck size={32} />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="p-6 bg-natural-surface rounded-3xl border border-natural-border">
                    <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-2">PAN Number</div>
                    <div className="text-lg font-bold tracking-widest">{user.kyc.pan}</div>
                  </div>
                  <div className="p-6 bg-natural-surface rounded-3xl border border-natural-border">
                    <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-2">Aadhar Number</div>
                    <div className="text-lg font-bold tracking-widest">XXXX-XXXX-{user.kyc.aadhar.slice(-4)}</div>
                  </div>
                  <div className="p-6 bg-natural-surface rounded-3xl border border-natural-border font-bold">
                    <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-2">Resident Indian</div>
                    <div className="text-lg">{user.kyc.isResident ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                <div className="mt-12">
                   <h3 className="text-[10px] font-bold uppercase tracking-widest text-natural-muted border-b border-natural-border pb-2 mb-6">Banking Details</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-natural-muted">Account Number</span>
                          <span className="font-bold">{user.kyc.bankDetails.accountNumber}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-natural-muted">IFSC Code</span>
                          <span className="font-bold">{user.kyc.bankDetails.ifsc}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-natural-muted">Bank Name</span>
                          <span className="font-bold">{user.kyc.bankDetails.bankName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-natural-muted">Beneficiary</span>
                          <span className="font-bold">{user.kyc.bankDetails.accountName}</span>
                        </div>
                      </div>
                   </div>
                </div>
                
                <button className="mt-10 py-3 px-8 border border-natural-border rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-natural-surface transition-all">
                  Update KYC / Bank Details
                </button>
              </div>
            ) : (
              <form onSubmit={handleKycSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {user.kyc?.status && (user.kyc.status as string) !== 'Approved' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-6 rounded-[24px] border ${
                        (user.kyc.status as string) === 'Rejected' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-blue-50 border-blue-100 text-blue-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Info size={16} />
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest leading-none">KYC {user.kyc.status}</h4>
                          <p className="text-xs mt-1 font-medium">
                            {(user.kyc.status as string) === 'Rejected' 
                              ? 'Your previous submission was rejected. Please review your documents and resubmit.' 
                              : 'Your application is being reviewed. You can update your details if needed.'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div className="bg-white p-10 rounded-[32px] border border-natural-border space-y-8">
                    <h2 className="text-xl font-serif italic text-natural-text border-b border-natural-border pb-4">Identity Verification</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">PAN Number</label>
                        <input 
                          type="text" 
                          placeholder="ABCDE1234F"
                          className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-2xl outline-none text-sm font-bold uppercase tracking-widest focus:border-natural-primary"
                          required
                          onChange={(e) => setKycForm({...kycForm, pan: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Aadhar Number</label>
                        <input 
                          type="text" 
                          placeholder="1234 5678 9012"
                          className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-2xl outline-none text-sm font-bold uppercase tracking-widest focus:border-natural-primary"
                          required
                          onChange={(e) => setKycForm({...kycForm, aadhar: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                         <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Upload PAN Card</label>
                         <div className="border-2 border-dashed border-natural-border rounded-[24px] p-8 flex flex-col items-center justify-center text-natural-muted hover:border-natural-primary hover:text-natural-primary transition-all cursor-pointer">
                            <Upload size={24} className="mb-2" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Click to upload</span>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Upload Aadhar Card</label>
                         <div className="border-2 border-dashed border-natural-border rounded-[24px] p-8 flex flex-col items-center justify-center text-natural-muted hover:border-natural-primary hover:text-natural-primary transition-all cursor-pointer">
                            <Upload size={24} className="mb-2" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Click to upload</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[32px] border border-natural-border space-y-8">
                    <h2 className="text-xl font-serif italic text-natural-text border-b border-natural-border pb-4">Banking Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Account Number</label>
                        <input 
                          type="text" 
                          placeholder="0000 0000 0000"
                          className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-2xl outline-none text-sm font-medium focus:border-natural-primary"
                          required
                          onChange={(e) => setKycForm({
                            ...kycForm, 
                            bankDetails: {...(kycForm.bankDetails as any), accountNumber: e.target.value}
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">IFSC Code</label>
                        <input 
                          type="text" 
                          placeholder="IFSC0001234"
                          className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-2xl outline-none text-sm font-bold uppercase tracking-widest focus:border-natural-primary"
                          required
                          onChange={(e) => setKycForm({
                            ...kycForm, 
                            bankDetails: {...(kycForm.bankDetails as any), ifsc: e.target.value}
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Bank Name</label>
                        <input 
                          type="text" 
                          placeholder="HDFC Bank"
                          className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-2xl outline-none text-sm font-medium focus:border-natural-primary"
                          required
                          onChange={(e) => setKycForm({
                            ...kycForm, 
                            bankDetails: {...(kycForm.bankDetails as any), bankName: e.target.value}
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Account Holder Name</label>
                        <input 
                          type="text" 
                          placeholder="Full name as per bank"
                          className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-2xl outline-none text-sm font-medium focus:border-natural-primary"
                          required
                          onChange={(e) => setKycForm({
                            ...kycForm, 
                            bankDetails: {...(kycForm.bankDetails as any), accountName: e.target.value}
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-white p-10 rounded-[32px] border border-natural-border space-y-8">
                     <h2 className="text-xl font-serif italic text-natural-text border-b border-natural-border pb-4">Declarations</h2>
                     <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Residential Status</label>
                          <select 
                            className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-xl text-xs font-bold uppercase tracking-widest outline-none"
                            onChange={(e) => setKycForm({...kycForm, isResident: e.target.value === 'resident'})}
                          >
                            <option value="resident">Resident Indian</option>
                            <option value="nri">Non-Resident Indian (NRI)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Employment Status</label>
                          <select 
                             className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-xl text-xs font-bold uppercase tracking-widest outline-none"
                             onChange={(e) => setKycForm({...kycForm, employmentStatus: e.target.value})}
                          >
                            <option value="">Select Status</option>
                            <option value="salaried">Salaried</option>
                            <option value="business">Business</option>
                            <option value="professional">Professional</option>
                            <option value="retired">Retired</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Annual Income</label>
                          <select 
                             className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-xl text-xs font-bold uppercase tracking-widest outline-none"
                             onChange={(e) => setKycForm({...kycForm, salaryRange: e.target.value})}
                          >
                            <option value="">Select Range</option>
                            <option value="5-10">5L - 10L</option>
                            <option value="10-25">10L - 25L</option>
                            <option value="25-50">25L - 50L</option>
                            <option value="50+">50L+</option>
                          </select>
                        </div>

                        <div className="flex items-start gap-3">
                           <input 
                            type="checkbox" 
                            className="mt-1 w-4 h-4 rounded border-natural-border text-natural-primary focus:ring-natural-primary" 
                            onChange={(e) => setKycForm({...kycForm, pepExposure: e.target.checked})}
                           />
                           <p className="text-[10px] text-natural-muted font-bold leading-relaxed uppercase tracking-widest">
                             I have no exposure to politically exposed persons (PEP).
                           </p>
                        </div>
                     </div>

                     <button type="submit" className="w-full py-4 bg-natural-primary text-white rounded-full text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-natural-primary/20 mt-8">
                       Submit KYC for Review
                     </button>
                   </div>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {activeTab === 'support' && (
          <motion.div
            key="support"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="bg-white p-10 rounded-[32px] border border-natural-border space-y-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 shadow-xl border border-natural-border">
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200" alt="RM" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-natural-primary uppercase tracking-[0.2em] mb-1">Your Relationship Manager</div>
                  <h2 className="text-2xl font-serif font-bold italic text-natural-text">Vikram Malhotra</h2>
                  <div className="flex items-center gap-2 text-green-600 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Available Now</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                 <div className="flex items-center justify-between p-4 bg-natural-surface rounded-2xl border border-natural-border group hover:border-natural-primary transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-natural-muted group-hover:text-natural-primary transition-colors">
                        <AtSign size={18} />
                      </div>
                      <div className="text-sm font-bold text-natural-text">vikram@afinue.com</div>
                    </div>
                    <ChevronRight size={16} className="text-natural-muted group-hover:translate-x-1 transition-all" />
                 </div>
                 <div className="flex items-center justify-between p-4 bg-natural-surface rounded-2xl border border-natural-border group hover:border-natural-primary transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-natural-muted group-hover:text-natural-primary transition-colors">
                        <Phone size={18} />
                      </div>
                      <div className="text-sm font-bold text-natural-text">+91 99912 44556</div>
                    </div>
                    <ChevronRight size={16} className="text-natural-muted group-hover:translate-x-1 transition-all" />
                 </div>
                 <button className="w-full py-4 bg-natural-text text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-natural-text/20 flex items-center justify-center gap-2 group transition-all">
                   <MessageSquare size={16} className="group-hover:scale-110 transition-all" /> Start Live Chat
                 </button>
              </div>
            </div>

            <div className="bg-natural-surface p-10 rounded-[32px] border border-natural-border space-y-8">
              <h2 className="text-xl font-serif italic text-natural-text">Support Central</h2>
              <p className="text-xs text-natural-muted leading-relaxed font-medium">Need quick help? Our support team is here to assist you with everything from KYC to payout technicalities.</p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-natural-muted shadow-sm">
                    <Headphones size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-natural-text uppercase tracking-widest">Common Support</div>
                    <div className="text-sm font-bold text-natural-muted mt-1">support@afinue.com</div>
                    <div className="text-sm font-bold text-natural-muted">1800-ALPHA-99</div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-natural-border">
                   <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-4">Quick Links</div>
                   <div className="space-y-2">
                      <button className="flex items-center justify-between w-full text-[11px] font-bold uppercase tracking-widest text-natural-text hover:text-natural-primary transition-colors py-2">
                        Help Documentation <ChevronRight size={14} />
                      </button>
                      <button className="flex items-center justify-between w-full text-[11px] font-bold uppercase tracking-widest text-natural-text hover:text-natural-primary transition-colors py-2">
                        Security Protocols <ChevronRight size={14} />
                      </button>
                      <button className="flex items-center justify-between w-full text-[11px] font-bold uppercase tracking-widest text-natural-text hover:text-natural-primary transition-colors py-2">
                        Tax Information <ChevronRight size={14} />
                      </button>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
