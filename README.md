# 🤖 AI Focus

> A collection of AI-powered projects — from PM productivity tools to real-time news intelligence.

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/abhi178219/AI_Product_manager_tools)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](LICENSE)

---

## 📂 Projects

### 🧠 AI PM Toolkit — [`/ai-pm-toolkit`](./ai-pm-toolkit)

> A curated collection of AI-powered tools built for Product Managers — PRD writing, user research synthesis, competitive intelligence, and more.

- **Stack:** Python, Streamlit, OpenAI GPT-4o, Claude 3.5 Sonnet
- **Run:** `streamlit run app.py` from any sub-folder
- [README](./ai-pm-toolkit/README.md) · [Contributing](./ai-pm-toolkit/CONTRIBUTING.md)

---

### 📰 NewsFlow — [`/newsflow`](./newsflow)

> A real-time, AI-tagged news aggregator for small teams. Bento layout with 5 category lanes, Claude Haiku AI insight tags, and personalised ranking via thumbs up/down signals.

- **Stack:** Next.js 16, Supabase, Claude Haiku, Tailwind CSS, Crawlee
- **Run:** `npm run dev` (frontend) + `node dist/index.js` (worker)
- **Sources:** Hacker News · HuggingFace · GitHub Releases · YourStory · Inc42 · BBC Business · NYT · GNews · Entrackr (crawled) · Reddit
- [README](./newsflow/README.md) · [Contributing](./newsflow/CONTRIBUTING.md) · [Setup Guide](./newsflow/SETUP.md)

---

## 🚀 Getting Started

Each project is self-contained. Navigate to the folder and follow its README:

```bash
# AI PM Toolkit (Python)
cd ai-pm-toolkit/prd_writer_agent
pip install -r requirements.txt
cp .env.example .env   # add your API key
streamlit run app.py

# NewsFlow (Node.js / Next.js)
cd newsflow
npm install
cp .env.local.example .env.local   # add Supabase + optional API keys
npm run dev
```

---

## 🙌 Contributing

Both projects welcome contributions. See their individual `CONTRIBUTING.md` files:

- [AI PM Toolkit → CONTRIBUTING.md](./ai-pm-toolkit/CONTRIBUTING.md)
- [NewsFlow → CONTRIBUTING.md](./newsflow/CONTRIBUTING.md)

---

## 📬 Built by

[@abhi178219](https://github.com/abhi178219) — product manager exploring the frontier of AI-powered workflows.

- GitHub: [abhi178219/AI_Product_manager_tools](https://github.com/abhi178219/AI_Product_manager_tools)
- LinkedIn: https://www.linkedin.com/in/sai-abhishek-v

⭐ **If this is useful, star the repo — it helps others discover it!**
