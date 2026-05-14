import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Phone, Lock, User, ArrowRight, ShieldCheck, Check, Loader2 } from 'lucide-react';

interface AuthFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  initialMode: 'login' | 'signup';
}

type AuthMode = 'login' | 'signup';
type LoginMethod = 'password' | 'otp';

export default function AuthFlow({ isOpen, onClose, onSuccess, initialMode }: AuthFlowProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    emailOtp: '',
    mobileOtp: ''
  });

  const [otpSentEmail, setOtpSentEmail] = useState(false);
  const [otpSentMobile, setOtpSentMobile] = useState(false);

  // Sync mode with initialMode when component opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      // Reset verification states on close/reopen
      setEmailVerified(false);
      setPhoneVerified(false);
      setOtpSentEmail(false);
      setOtpSentMobile(false);
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVerifyRequest = (type: 'email' | 'phone') => {
    if (type === 'email') {
      if (!formData.email) return;
      setVerifyingEmail(true);
      setTimeout(() => {
        setVerifyingEmail(false);
        setOtpSentEmail(true);
      }, 1000);
    } else {
      if (!formData.mobile) return;
      setVerifyingPhone(true);
      setTimeout(() => {
        setVerifyingPhone(false);
        setOtpSentMobile(true);
      }, 1000);
    }
  };

  const handleOtpVerify = (type: 'email' | 'phone') => {
    if (type === 'email') {
      if (formData.emailOtp === '123456') { // Mock OTP
        setEmailVerified(true);
        setOtpSentEmail(false);
      }
    } else {
      if (formData.mobileOtp === '123456') { // Mock OTP
        setPhoneVerified(true);
        setOtpSentMobile(false);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      // Simulate login
      onSuccess({ 
        firstName: 'John', 
        lastName: 'Doe',
        email: formData.email || 'user@example.com'
      });
    } else {
      // For demo, we might want to check if verified, but let's just proceed
      // Simulate signup success
      onSuccess({ 
        firstName: formData.firstName, 
        lastName: formData.lastName,
        email: formData.email,
        mobile: formData.mobile
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-natural-text/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[480px] bg-natural-bg rounded-[40px] shadow-2xl overflow-hidden border border-natural-border"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-natural-muted hover:text-natural-text hover:bg-natural-surface rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 sm:p-12">
          <div className="mb-8">
            <span className="text-2xl font-serif font-bold italic tracking-tight text-natural-primary">afinue</span>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="text-3xl font-serif font-bold text-natural-text mb-2 italic">Welcome Back</h2>
                <p className="text-natural-muted text-sm font-bold mb-8">Access your investment portfolio.</p>

                <div className="flex p-1 bg-natural-surface rounded-xl mb-8 border border-natural-border">
                  <button 
                    onClick={() => setLoginMethod('password')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${loginMethod === 'password' ? 'bg-white shadow-sm text-natural-text' : 'text-natural-muted'}`}
                  >
                    Password
                  </button>
                  <button 
                    onClick={() => setLoginMethod('otp')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${loginMethod === 'otp' ? 'bg-white shadow-sm text-natural-text' : 'text-natural-muted'}`}
                  >
                    OTP
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-natural-text uppercase tracking-widest">Email or Mobile</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-natural-muted" size={16} />
                      <input 
                        type="text" 
                        name="email"
                        placeholder="your@email.com"
                        className="w-full pl-12 pr-4 py-4 bg-white border border-natural-border focus:border-natural-primary rounded-2xl outline-none transition-all text-sm font-medium"
                        required
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {loginMethod === 'password' ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-natural-text uppercase tracking-widest">Password</label>
                        <button type="button" className="text-[10px] font-bold text-natural-primary uppercase tracking-widest underline underline-offset-4">Forgot?</button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-natural-muted" size={16} />
                        <input 
                          type="password" 
                          name="password"
                          placeholder="••••••••"
                          className="w-full pl-12 pr-4 py-4 bg-white border border-natural-border focus:border-natural-primary rounded-2xl outline-none transition-all text-sm font-medium"
                          required
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-natural-text uppercase tracking-widest">Enter OTP</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-natural-muted" size={16} />
                        <input 
                          type="text" 
                          placeholder="123456"
                          className="w-full pl-12 pr-4 py-4 bg-white border border-natural-border focus:border-natural-primary rounded-2xl outline-none transition-all text-sm font-bold tracking-[0.5em]"
                          required
                        />
                        <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-natural-primary uppercase tracking-widest">Get OTP</button>
                      </div>
                    </div>
                  )}

                  <button className="w-full py-4 bg-natural-primary text-white rounded-full font-bold text-sm uppercase tracking-widest flex items-center justify-center hover:bg-natural-primary/90 mt-8 group transition-all shadow-xl shadow-natural-primary/20">
                    Sign In
                    <ArrowRight className="ml-2 group-hover:translate-x-1" size={16} />
                  </button>
                </form>

                <p className="text-center mt-12 text-xs font-bold text-natural-muted">
                  Don't have an account? {' '}
                  <button onClick={() => setMode('signup')} className="text-natural-primary uppercase tracking-widest underline underline-offset-4 ml-2">Sign Up</button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-3xl font-serif font-bold text-natural-text mb-2 italic">Create Account</h2>
                <p className="text-natural-muted text-sm font-bold mb-8">Start your alternative investment journey.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-natural-text uppercase tracking-widest">First Name</label>
                      <input 
                        type="text" 
                        name="firstName"
                        placeholder="John"
                        className="w-full px-4 py-4 bg-white border border-natural-border focus:border-natural-primary rounded-2xl outline-none transition-all text-sm font-medium"
                        required
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-natural-text uppercase tracking-widest">Last Name</label>
                      <input 
                        type="text" 
                        name="lastName"
                        placeholder="Doe"
                        className="w-full px-4 py-4 bg-white border border-natural-border focus:border-natural-primary rounded-2xl outline-none transition-all text-sm font-medium"
                        required
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-natural-text uppercase tracking-widest flex justify-between">
                      Mobile Number
                      {phoneVerified && <span className="text-green-600 flex items-center gap-1"><Check size={10} /> Verified</span>}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-natural-muted" size={16} />
                      <input 
                        type="tel" 
                        name="mobile"
                        placeholder="+91 9991234567"
                        className="w-full pl-12 pr-28 py-4 bg-white border border-natural-border focus:border-natural-primary rounded-2xl outline-none transition-all text-sm font-medium"
                        required
                        onChange={handleInputChange}
                      />
                      <button 
                        type="button"
                        onClick={() => handleVerifyRequest('phone')}
                        disabled={phoneVerified || verifyingPhone || otpSentMobile}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-natural-primary uppercase tracking-widest hover:bg-natural-surface px-2 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        {verifyingPhone ? <Loader2 size={14} className="animate-spin" /> : phoneVerified ? 'Verified' : otpSentMobile ? 'Sent' : 'Verify'}
                      </button>
                    </div>
                    {otpSentMobile && (
                      <div className="flex gap-2 mt-2">
                        <input 
                          type="text" 
                          name="mobileOtp"
                          placeholder="OTP"
                          maxLength={6}
                          className="flex-1 px-4 py-2 bg-natural-surface border border-natural-border rounded-xl text-xs font-bold tracking-widest outline-none focus:border-natural-primary transition-all"
                          onChange={handleInputChange}
                        />
                        <button 
                          type="button"
                          onClick={() => handleOtpVerify('phone')}
                          className="px-4 py-2 bg-natural-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
                        >
                          Check
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-natural-text uppercase tracking-widest flex justify-between">
                      Email Address
                      {emailVerified && <span className="text-green-600 flex items-center gap-1"><Check size={10} /> Verified</span>}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-natural-muted" size={16} />
                      <input 
                        type="email" 
                        name="email"
                        placeholder="your@email.com"
                        className="w-full pl-12 pr-28 py-4 bg-white border border-natural-border focus:border-natural-primary rounded-2xl outline-none transition-all text-sm font-medium"
                        required
                        onChange={handleInputChange}
                      />
                      <button 
                        type="button"
                        onClick={() => handleVerifyRequest('email')}
                        disabled={emailVerified || verifyingEmail || otpSentEmail}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-natural-primary uppercase tracking-widest hover:bg-natural-surface px-2 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        {verifyingEmail ? <Loader2 size={14} className="animate-spin" /> : emailVerified ? 'Verified' : otpSentEmail ? 'Sent' : 'Verify'}
                      </button>
                    </div>
                    {otpSentEmail && (
                      <div className="flex gap-2 mt-2">
                        <input 
                          type="text" 
                          name="emailOtp"
                          placeholder="OTP"
                          maxLength={6}
                          className="flex-1 px-4 py-2 bg-natural-surface border border-natural-border rounded-xl text-xs font-bold tracking-widest outline-none focus:border-natural-primary transition-all"
                          onChange={handleInputChange}
                        />
                        <button 
                          type="button"
                          onClick={() => handleOtpVerify('email')}
                          className="px-4 py-2 bg-natural-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
                        >
                          Check
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-natural-text uppercase tracking-widest">Create Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-natural-muted" size={16} />
                      <input 
                        type="password" 
                        name="password"
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 bg-white border border-natural-border focus:border-natural-primary rounded-2xl outline-none transition-all text-sm font-medium"
                        required
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 pt-4">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-natural-border text-natural-primary focus:ring-natural-primary" required />
                    <p className="text-[10px] text-natural-muted font-bold leading-relaxed uppercase tracking-wider">
                      I agree to the <button type="button" className="text-natural-primary underline">Terms</button> & <button type="button" className="text-natural-primary underline">Privacy Policy</button>.
                    </p>
                  </div>

                  <button 
                    disabled={!emailVerified || !phoneVerified}
                    className="w-full py-4 bg-natural-primary text-white rounded-full font-bold text-sm uppercase tracking-widest flex items-center justify-center hover:bg-natural-primary/90 mt-8 group transition-all shadow-xl shadow-natural-primary/20 disabled:grayscale disabled:opacity-50"
                  >
                    Complete Sign Up
                    <ArrowRight className="ml-2 group-hover:translate-x-1" size={16} />
                  </button>

                  <p className="text-center mt-12 text-xs font-bold text-natural-muted">
                    Already have an account? {' '}
                    <button onClick={() => { setMode('login'); }} className="text-natural-primary uppercase tracking-widest underline underline-offset-4 ml-2">Sign In</button>
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
