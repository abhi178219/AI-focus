import { motion } from 'motion/react';
import { UserPlus, Wallet, BarChart3, Coins } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Instant Onboarding',
    description: 'Complete your KYC and setup your account in less than 2 minutes with our seamless digital process.'
  },
  {
    icon: Wallet,
    title: 'Pick Your Asset',
    description: 'Browse through our curated list of equipment leasing, real estate deals, and rare collectibles.'
  },
  {
    icon: Coins,
    title: 'Invest Securely',
    description: 'Start with small tickets and build a diversified portfolio managed by industry experts.'
  },
  {
    icon: BarChart3,
    title: 'Track & Earn',
    description: 'Monitor your investment performance and receive monthly payouts directly into your wallet.'
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-natural-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-natural-text mb-4 italic">How Afinue Works</h2>
          <p className="text-lg text-natural-muted max-w-2xl mx-auto font-medium">
            The path to sophisticated investing has never been clearer. Follow these four simple steps to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white p-8 rounded-[32px] border border-natural-border shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
            >
              <div className="absolute top-0 right-0 p-4 font-serif text-6xl text-natural-surface font-bold group-hover:text-natural-border/30 transition-colors pointer-events-none">
                0{index + 1}
              </div>
              <div className="w-14 h-14 bg-natural-primary rounded-2xl flex items-center justify-center text-white mb-6 relative z-10 transition-transform group-hover:scale-110 shadow-lg shadow-natural-primary/20">
                <step.icon size={28} />
              </div>
              <h3 className="text-sm font-bold text-natural-text mb-3 relative z-10 uppercase tracking-widest">{step.title}</h3>
              <p className="text-natural-muted leading-relaxed text-sm relative z-10 font-medium">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
