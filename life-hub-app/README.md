# 🚀 Life & Business Hub - Modular PWA & Cloud Dashboard (Demo Template)

A sleek, modern, and production-ready Web Application & Personal Financial Operating System built with **HTML5, Vanilla CSS (Glassmorphism), Vanilla JS (ES6+), Vercel Serverless Functions, and Google Identity OAuth2**.

Designed for entrepreneurs, freelancers, and individuals managing daily finances, business revenue, calendar schedules, and automated LINE notifications.

---

## ✨ Features Highlight

### 📊 1. Business & Sales Dashboard
- **Revenue & Expense Management**: Real-time sales vs. raw material cost tracking.
- **Top Sellers Ranking**: Interactive charts powered by Chart.js.

### 💵 2. Personal Finance & Wealth Goals
- **Income & Expense Tracker**: Transaction logging with custom categories.
- **Savings Goals & Progress**: Dynamic visual progress bars and milestone indicators.

### 📅 3. Interactive Calendar & Daily Planner
- **Availability Management**: Mark free vs. busy days with event notes.
- **Task System**: Interactive checklist with priority levels and due dates.

### 🤖 4. AI Assistant & Real-time Integrations
- **AI Chatbot**: Intelligent productivity assistant with voice input support (Web Speech API).
- **LINE Broadcast & Notify**: Serverless message sending to LINE Official Accounts.
- **Gmail Integration**: Google Identity Services OAuth2 login & email feed reader.

---

## 🔒 Security & Architecture Decisions (Portfolio Guide)

When presenting this project in a developer portfolio or interview, here are key security design patterns implemented:

### 1. 🔑 Environment Variable & Secret Isolation
- **Pattern**: No hardcoded API keys, tokens, or personal identifiers in client-side code or Git repository.
- **Implementation**: Serverless functions (`/api/send-line`, `/api/daily-report`) load secrets from `process.env.LINE_CHANNEL_ACCESS_TOKEN`. Local development uses `.env.local` which is explicitly ignored in `.gitignore`.

### 2. 🛡️ XSS (Cross-Site Scripting) Prevention
- **Pattern**: Input Sanitization on user-supplied strings before rendering to the DOM.
- **Implementation**: Helper function `escapeHTML()` converts characters like `<`, `>`, `"` to HTML Entities (`&lt;`, `&gt;`, `&quot;`) preventing malicious script injection.

### 3. 🌐 HTTP Security Headers & Anti-Clickjacking
- **Pattern**: Production-grade HTTP headers configured via `vercel.json`.
- **Headers Included**:
  - `X-Frame-Options: DENY`: Prevents Clickjacking attacks by forbidding iframe embedding.
  - `X-Content-Type-Options: nosniff`: Blocks MIME-type sniffing vulnerabilities.
  - `Referrer-Policy: strict-origin-when-cross-origin`: Controls referrer data exposure.
  - `X-XSS-Protection: 1; mode=block`: Enables browser XSS filtering protections.

### 4. 🛂 API Authentication & CORS Scoping
- **Pattern**: Restricting unauthorized backend invocations.
- **Implementation**: `/api/daily-report` validates `CRON_SECRET` Bearer Tokens sent by Vercel's automated scheduler.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Glassmorphism Design Token System), Vanilla JavaScript (ES6 Modules)
- **Backend / API**: Vercel Serverless Functions (Node.js)
- **Integrations**: LINE Messaging API / LINE Notify, Google Identity Services OAuth2
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

3. **Run Locally**:
   Open `index.html` directly in your browser or run via Vercel CLI:
   ```bash
   npx vercel dev
   ```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
