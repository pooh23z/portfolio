# 🚀 Life & Business Hub - Modular PWA & Cloud Dashboard (Demo Template)

A sleek, modern, and production-ready Web Application & Personal Financial Operating System built with **HTML5, Vanilla CSS (Glassmorphism), Vanilla JS (ES6+), Vercel Serverless Functions, Firebase Realtime Database, and Google Identity OAuth2**.

Designed for entrepreneurs, freelancers, and individuals managing daily finances, business revenue, calendar schedules, and automated LINE notifications.

---

## ✨ Features Highlight

### 📊 1. Business & Sales Dashboard
- **Revenue & Expense Management**: Real-time sales vs. raw material cost tracking.
- **Google Sheets Live Sync**: Instant CSV data integration with automated fallback.
- **Top Sellers Ranking**: Interactive charts powered by Chart.js.

### 💵 2. Personal Finance & Wealth Goals
- **Income & Expense Tracker**: Transaction logging with custom categories.
- **Savings Goals & Progress**: Dynamic visual progress bars and milestone indicators.

### 📅 3. Interactive Calendar & Daily Planner
- **Availability Management**: Mark free vs. busy days with event notes.
- **Task System**: Interactive checklist with priority levels and due dates.

### 🤖 4. AI Assistant & Real-time Integrations
- **AI Chatbot**: Intelligent productivity assistant with voice input support (Web Speech API).
- **LINE Broadcast & Notify**: Direct CORS-free serverless message sending to LINE Official Accounts.
- **Gmail Integration**: Google Identity Services OAuth2 login & email feed reader.

### ☁️ 5. Realtime Cloud Sync
- **Firebase Realtime Database**: Multi-device sync (Mac, Web, Mobile) via custom 6-character room codes.
- **Offline First**: Instant local state updates using `localStorage` with non-blocking cloud hydration.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Glassmorphism Design Token System), Vanilla JavaScript (ES6 Modules)
- **Backend / API**: Vercel Serverless Functions (Node.js)
- **Database**: Firebase Realtime Database
- **Integrations**: LINE Messaging API / LINE Notify, Google Sheets CSV Feed, Google Identity Services OAuth2
- **Data Visualization**: Chart.js

---

## 🚀 Quick Start / Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/life-hub-demo.git
   cd life-hub-demo
   ```

2. **Environment Variables Configuration**:
   Copy `.env.example` to `.env.local` and add your secret keys:
   ```bash
   cp .env.example .env.local
   ```

   Variables reference:
   ```env
   LINE_CHANNEL_ACCESS_TOKEN="your_line_channel_access_token_here"
   SYNC_ROOM_CODE="DEMO-2026"
   SALES_CSV_URL="https://docs.google.com/spreadsheets/d/your_sales_sheet_gid"
   COST_CSV_URL="https://docs.google.com/spreadsheets/d/your_cost_sheet_gid"
   ```

3. **Run Locally**:
   Simply serve the folder using any HTTP server or Vercel CLI:
   ```bash
   npx vercel dev
   ```
   Or open `index.html` directly in your browser!

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
