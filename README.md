# PAYTM SAATHI
### *Your business. Your language. Your AI partner.*

A multilingual, voice-first AI business assistant for Indian kirana stores, tea shops, small retail shops, and street vendors. Powered by **Sarvam AI** (`saaras:v4` Speech-to-Text & `bulbul:v4-flash` Text-to-Speech) and built with **React**, **FastAPI**, and **SQLite**.

---

## 🚀 Live Demo Quickstart

### 1. Running the Application
Both servers can be started together with the included script:
```bash
./run.sh
```
Or run individually:

**Backend:**
```bash
python3 -m uvicorn server:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend && npm run dev
```

- **📱 Mobile App Simulator (Light Theme):** [http://localhost:5174](http://localhost:5174)
- **💻 Web Analytics Dashboard:** [http://localhost:5173](http://localhost:5173)
- **⚙️ Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔑 Sarvam AI API Key
The key is kept securely in the backend environment file and is never exposed to the frontend:
- Location: `.env` in the project root
```env
SARVAM_API_KEY=your_sarvam_api_key_here
```

---

## 🎯 15-Step Hackathon Demo Scenario (Verified & Working)

1. **Open Paytm Saathi Dashboard** ([http://localhost:5173](http://localhost:5173)).
2. **Observe initial state:** Simulated Paytm QR Collections shows **₹1,000 (DEMO DATA)**.
3. **Click "Trigger Closing Reminder"** on the dashboard or top header.
4. **Voice Saathi speaks** in your selected language (Telugu, Hindi, or English):
   > *"Your demo Paytm QR collections today are ₹1,000. How much cash did you collect?"*
5. **Speak or type:**
   > *"I collected ₹2,500."*
6. **Voice Saathi asks about expenses:**
   > *"Okay, cash collections noted as ₹2,500. Did you have any expenses today?"*
7. **Speak or type:**
   > *"I paid ₹500 for electricity."*
8. **Voice Saathi asks about stock purchases:**
   > *"Recorded expense of ₹500 (Electricity bill). Did you purchase any new stock today?"*
9. **Speak or type:**
   > *"I purchased 20 milk packets for ₹600."*
10. **Voice Saathi presents the interactive Reconciliation Summary card:**
    - QR Collections: ₹1,000
    - Cash Collections: ₹2,500
    - Electricity Expense: ₹500
    - Milk Stock Purchase: ₹600 (20 packets)
    > *"Would you like me to save these records?"*
11. **Click "Confirm & Save"** or say *"Yes"* / *"అవును"* / *"हाँ"*.
12. **All entries are saved atomically in SQLite.**
13. **Dashboard automatically updates:** Total Collections = ₹3,500, Expenses = ₹500, Estimated Balance = ₹2,400.
14. **Inventory updates:** Milk stock shows Purchased: 20, Sold: 15, Remaining: 5 packets.
15. **Ask any business question via voice or text:**
    > *"How much did I collect today?"*
    Voice Saathi answers using actual SQLite records and speaks back using Sarvam Bulbul:
    > *"Today your total collections are ₹3,500 (Paytm QR: ₹1,000, Cash: ₹2,500)."*

---

## 📱 Features & Screens

1. **Dashboard:**
   - Today's QR collections (Paytm Soundbox demo data).
   - Cash collections, total collections, expenses, and estimated business balance.
   - Interactive 7-day performance chart (Recharts).
   - Dynamic AI business insights derived from real DB records.
   - Quick CTA to trigger daily closing reminder.
2. **Voice Saathi:**
   - Voice-first conversational interface with microphone recording (`navigator.mediaDevices`).
   - Sarvam Saaras v4 STT for accurate Indian speech recognition.
   - Sarvam Bulbul v4 Flash TTS for natural Indian voice responses.
   - Full support for **Telugu (`te-IN`)**, **Hindi (`hi-IN`)**, and **English (`en-IN`)**.
   - Confirmation safety gate before persisting financial data.
   - Text input fallback for environments without microphone access.
3. **Inventory Management:**
   - Real-time stock levels using the formula: `Remaining = Opening + Purchases - Sales`.
   - Low-stock threshold warnings.
   - Add new products and adjust stock (purchase, sale, correction).
4. **Business Records & Ledgers:**
   - Complete ledger of QR collections, cash collections, expenses, and stock purchases.
   - Filtering by date and transaction type.
   - Daily and monthly summaries.
   - Edit and delete records with immediate balance recalculation.
5. **Settings & Diagnostics:**
   - Merchant store details (shop name, category, language, closing time).
   - Sarvam AI stack status indicator.
   - One-click "Reset Demo Data" button to repeat the hackathon demo from scratch.

---

## 🏗️ Project Architecture

```
Paytm Hackathon/
├── .env                       # Backend Sarvam AI API Key (Git-ignored)
├── .gitignore                 # Ignores .env, __pycache__, node_modules
├── run.sh                     # One-click startup script for both servers
├── backend/
│   ├── server.py              # FastAPI server, REST routes, static file serving
│   ├── database.py            # SQLite database schema, connections & initial seeding
│   ├── models.py              # Pydantic schemas for transactions, inventory, profiles
│   ├── data/
│   │   └── saathi.db          # Shared SQLite database
│   └── services/
│       ├── sarvam_service.py  # Sarvam Saaras v4 STT & Bulbul v4 Flash TTS integration
│       └── intent_engine.py   # Closing state machine & DB question answering
└── frontend/
    ├── package.json
    ├── vite.config.js         # Configured with proxy to backend port 8000
    ├── tailwind.config.js     # Paytm fintech color scheme
    ├── index.html
    └── src/
        ├── App.jsx            # State management & navigation
        ├── translations.js    # Telugu, Hindi & English UI strings
        ├── index.css
        └── components/
            ├── Sidebar.jsx
            ├── Header.jsx
            ├── DashboardView.jsx
            ├── VoiceSaathiView.jsx
            ├── InventoryView.jsx
            ├── RecordsView.jsx
            └── SettingsView.jsx
```
