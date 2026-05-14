import { Twitter, Linkedin, Github, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-natural-surface border-t border-natural-border pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="lg:col-span-1">
            <span className="text-3xl font-serif font-bold italic tracking-tight text-natural-primary mb-6 block">afinue</span>
            <p className="text-natural-muted text-sm leading-relaxed mb-8 max-w-xs font-medium">
              Democratizing access to institutional-grade, asset-backed opportunities for the modern investor.
            </p>
            <div className="flex space-x-3">
              {['Twitter', 'LinkedIn', 'Instagram'].map(social => (
                <a key={social} href="#" className="w-10 h-10 rounded-full bg-white border border-natural-border flex items-center justify-center text-natural-muted hover:bg-natural-primary hover:text-white hover:border-natural-primary transition-all shadow-sm">
                  <span className="sr-only">{social}</span>
                  <div className="w-4 h-4 bg-current rounded-sm"></div>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-natural-text uppercase tracking-[0.2em] mb-8">Invest</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-natural-muted hover:text-natural-primary text-xs font-bold transition-colors">Asset Leasing</a></li>
              <li><a href="#" className="text-natural-muted hover:text-natural-primary text-xs font-bold transition-colors">Real Estate</a></li>
              <li><a href="#" className="text-natural-muted hover:text-natural-primary text-xs font-bold transition-colors">Scotch Collectibles</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-natural-text uppercase tracking-[0.2em] mb-8">Company</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-natural-muted hover:text-natural-primary text-xs font-bold transition-colors">About Us</a></li>
              <li><a href="#" className="text-natural-muted hover:text-natural-primary text-xs font-bold transition-colors">Insights</a></li>
              <li><a href="#" className="text-natural-muted hover:text-natural-primary text-xs font-bold transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-natural-text uppercase tracking-[0.2em] mb-8">Newsletter</h4>
            <p className="text-xs text-natural-muted mb-4 font-bold">Stay updated with fresh deals.</p>
            <div className="flex bg-white p-1 rounded-2xl border border-natural-border focus-within:border-natural-primary transition-colors">
              <input type="email" placeholder="Email" className="bg-transparent px-4 py-2 text-xs w-full outline-none font-bold" />
              <button className="bg-natural-primary text-white p-2 rounded-xl hover:bg-natural-primary/90">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-natural-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">© 2026 Afinue Technologies Private Limited.</p>
          <div className="flex space-x-8 text-[10px] font-bold uppercase tracking-widest">
            <a href="#" className="text-natural-muted hover:text-natural-text">Privacy</a>
            <a href="#" className="text-natural-muted hover:text-natural-text">Terms</a>
            <a href="#" className="text-natural-muted hover:text-natural-text">Risk</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
