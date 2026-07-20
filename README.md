# 🚀 CodePulse AI - Autonomous SAST Scanner & AI Auto-Fix Engine

CodePulse AI is an enterprise-grade Static Application Security Testing (SAST) platform engineered to clone, scan, visualize, and autonomously remediate security vulnerabilities in application source code. Equipped with a custom AST-driven rule parser, a real-time inline code diff engine, multi-format audit compliance exporting, and instant webhook alert streaming.

---

## 🛠️ Core Modules

### 1. AST Core Engine
- Custom Abstract Syntax Tree (AST) signature parsing logic evaluating source code against corporate baseline rules.
- Continuous signature inspection tracking hardcoded API credentials, exposed secret keys, unsafe dynamic code execution, and unhandled exception blocks.

### 2. Remediation Pipeline
- Real-time side-by-side Red/Green differential code rendering comparing baseline vulnerabilities with secure refactored code.
- Optimized DOM key virtualization mechanism executing instant, cache-free UI viewport hot-swapping and atomic state synchronization.

### 3. Compliance Reporting
- Executive analytics dashboard calculating live OWASP Top 10 readiness metrics, exposure surface percentages, and system autonomy stats.
- Programmatic PDF generation engine and developer JSON metadata export tools for C-Suite governance and security audits.

### 4. Event Notifications Hook
- Asynchronous outbound event publisher supporting custom webhook subscriptions for security events.
- Channel formatters delivering rich native Markdown blocks for Slack and color-coded Rich Embed cards for Discord with real-time connection status validation.

---

## 💻 Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, TypeScript
- **Backend:** Node.js, Express, PostgreSQL / Supabase, PDFKit
- **Integrations:** Outbound Slack / Discord Webhooks, Unified Git Patch Generator

---

## 🚀 Getting Started

### 📋 Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database or Supabase connection string

### 🔧 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sarthak170306/ReviewPulse.git
   cd ReviewPulse
   ```

2. **Backend Configuration:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Frontend Configuration:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
