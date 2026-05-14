# Afinue — Alternative Investment Platform (WealthTech)

> A product concept & working prototype for an institutional-grade alternative investment marketplace targeting India's emerging affluent investor segment.

---

## Overview

**Afinue** is a WealthTech platform that democratises access to alternative asset classes — equipment leasing, commercial real estate, rare collectibles, and corporate debt — traditionally reserved for HNIs and institutional investors. The platform combines a curated deal marketplace with AI-powered portfolio insights and a white-glove Relationship Manager layer.

This project was built as a product prototype to validate UX flows, investor onboarding journeys, and the core dashboard experience before a full-scale engineering build.

---

## Product Screens & Features

| Module | What it does |
|---|---|
| **Landing / Discovery** | Hero, featured deals, investment class education, social proof |
| **Auth Flow** | Sign-up → KYC → Bank verification → OTP in a single modal |
| **Deal Marketplace** | Filter by asset class, IRR range, tenure; sortable deal cards with status badges |
| **Deal Detail** | Full deal memo — IRR, risk rating, payout schedule, similar deals |
| **Investor Dashboard** | Portfolio value, unrealised gains, active vs matured investments |
| **Portfolio Tracker** | Asset-class breakdown, expected payout calendar, transaction ledger |
| **AI Insights** | Gemini-powered investment insights and portfolio suggestions |
| **Profile & KYC** | PAN/Aadhaar upload, employment details, bank account management |
| **Refer & Earn** | Referral code generation, reward tracking, payout history |

---

## Investment Asset Classes

```
Asset Leasing      → Equipment / EV fleet / industrial machinery (14–17% IRR)
Real Estate        → Pre-leased commercial / retail / office subvention (18–21% IRR)
Collectibles       → Rare scotch casks, vintage assets (12–16% IRR)
Corporate Debt     → Short-tenure NCDs and invoice discounting
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS v4 |
| Animation | Motion (Framer Motion) |
| Charts | Recharts |
| AI Layer | Google Gemini API (`@google/genai`) |
| Icons | Lucide React |
| Routing | React Router v7 |

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Add your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env.local

# 3. Start dev server
npm run dev
# → http://localhost:3000
```

---

## Product Thinking Behind This Build

### Problem
India's retail investors are largely constrained to equities, FDs, and mutual funds. Alternatives (leasing, RE, collectibles) offer superior risk-adjusted returns but historically required ₹50L+ commitments and institutional connections.

### Solution
Afinue lowers the minimum ticket size (starting ₹25,000), provides transparent deal memos, and wraps it in a consumer-grade UX that builds trust via KYC, RM access, and real-time portfolio tracking.

### Key Design Decisions
- **Onboarding-first**: Auth modal triggers contextually (CTAs, deal interactions) — no hard login gate that drops bounce rate
- **Deal Memo depth**: Every deal card links to a full memo with IRR, payout schedule, risk factors — reduces investor anxiety
- **RM as trust signal**: Each verified user gets a named RM (photo, email, phone) — mimics private banking without the cost
- **AI Insights tab**: Gemini integration surfaces portfolio recommendations and market context — differentiates vs static platforms

### Metrics This Design Optimises For
- Time-to-first-investment (onboarding funnel completion)
- Deal CTR from marketplace to detail page
- KYC completion rate
- Repeat investment rate (portfolio stickiness)

---

## Folder Structure

```
afinue/
├── src/
│   ├── App.tsx                    # Root — auth state, view routing
│   ├── types.ts                   # Domain types: Deal, User, KYC, Portfolio
│   ├── components/
│   │   ├── Hero.tsx               # Landing hero + stats
│   │   ├── FeaturedDeals.tsx      # Homepage deal showcase
│   │   ├── InvestmentClasses.tsx  # Asset class education
│   │   ├── WhyInvest.tsx          # Trust signals / social proof
│   │   ├── HowItWorks.tsx         # 3-step onboarding explainer
│   │   ├── AuthFlow.tsx           # Sign-up / Login modal + KYC
│   │   ├── Dashboard.tsx          # Logged-in shell + deal marketplace
│   │   ├── DealDetails.tsx        # Full deal memo page
│   │   ├── Portfolio.tsx          # Holdings, payouts, transactions
│   │   ├── Insights.tsx           # Gemini AI insights panel
│   │   ├── Profile.tsx            # User profile + KYC status
│   │   ├── ReferAndEarn.tsx       # Referral programme
│   │   ├── Header.tsx             # Nav bar (pre/post login)
│   │   └── Footer.tsx
│   ├── index.css                  # Tailwind base + custom design tokens
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Status

**Prototype / V1 Frontend** — This is a functional UI prototype with mock data. It demonstrates the full product vision and investor journey. Backend API integration (deal sourcing, payment gateway, KYC provider) is the next engineering milestone.

---

*Built by Sai Abhishek as part of product portfolio — showcasing end-to-end WealthTech product thinking from user research to prototype.*
