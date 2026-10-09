# 🛡️ Finomaly — Behavioral Biometrics & Mule Account Detection Layer

> **The Future Is Safe.** Passwords can be stolen. The way you move cannot be easily copied.

Finomaly is an advanced, privacy-first continuous authentication prototype engineered to detect **mule accounts, account takeovers, and unauthorized operators** in real-time through behavioral biometrics.

---

## 📌 The Problem: The Identity Gap in Financial Security

Traditional banking security relies heavily on static credentials (passwords, PINs) and 2FA (SMS OTPs, authenticator apps). 

In **mule account fraud** and **account takeover schemes**:
* Fraudsters routinely possess correct passwords and valid OTPs (purchased or coerced).
* Traditional authentication passes the imposter because credentials check out at login.

**Finomaly asks a better question:** *Does the person behind the keyboard still move and type like the legitimate account owner?*

---

## ✨ Key Features

* **🧠 5D Telemetry Vector Extraction**:
  Measures five distinct neuromuscular habits:
  1. *Average Keystroke Hold Time* (Dwell Time in ms)
  2. *Average Flight Time* (Gap between keypresses in ms)
  3. *Typing Speed* (Words Per Minute / WPM)
  4. *Hold Time Variance* (Consistency of key holds)
  5. *Flight Time Variance* (Rhythm consistency)

* **🔄 3-Session Baseline Enrollment**:
  Captures a multi-session baseline profile (`S1`, `S2`, `S3`) to construct a highly accurate behavioral centroid.

* **⚙️ Hybrid Similarity Engine (`biometrics.ts`)**:
  Combines **Weighted Cosine Similarity** with a **Euclidean Distance Penalty**. Large behavioral gaps (e.g. WPM differences or hold time anomalies) meaningfully drop the similarity score.

* **🚫 Zero-Telemetry & Bot Interceptor**:
  Instantly flags automated scripts, synthetic key injectors, zero-variance robotic typing (0ms hold times), and copy-paste events.

* **🔒 Privacy by Design (Client-Side Edge Engine)**:
  All keystroke timing telemetry is computed 100% locally inside the browser memory. No raw keystroke content or financial data ever leaves the user's device.

---

## 🛠️ Tech Stack

### **Frontend & Framework**
* **Next.js 14** (App Router architecture)
* **React 18** (Client & Server Components)
* **TypeScript 5** (Strict type safety)

### **Design, Styling & Motion**
* **Framer Motion 11** (Fluid UI transitions and HUD overlays)
* **CSS Modules & Custom Utility Variables** (Cyberpunk dark theme `#080c0d`, cyan neon `#00f5d4`)
* **HTML5 Canvas & Web Audio API** (Procedural sound synthesizer and 3D warp tunnel animation)

### **Analytics & Data Science**
* **Python 3** (`generate_report_pdf.py` / `generate_clean_pdf.py`)
* **Pandas / NumPy / ReportLab**: Data processing for the **1,000-Experiment Biometric Benchmark Report**.

---

## 📁 Project Structure

```text
finomaly/
├── app/
│   ├── demo/
│   │   ├── BaselineSession.tsx      # 3-Session baseline enrollment component
│   │   ├── LoginSession.tsx         # Live authentication verification test
│   │   ├── ResultsView.tsx          # Match score, radar charts, & feature deltas
│   │   ├── biometrics.ts            # Hybrid similarity engine & 5D vector normalization
│   │   ├── HowItWorksAnimation.tsx  # Interactive 3D visual walkthrough
│   │   └── DemoModal.tsx            # Main interactive demo modal
│   ├── globals.css                  # Custom styling & theme variables
│   ├── layout.tsx                   # Main layout container
│   └── page.tsx                     # Landing page
├── public/
│   └── Finomaly_Biometric_1000_Experiment_Report.pdf  # 1,000-Experiment Research Report
├── generate_report_pdf.py           # Report generation script
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** or **pnpm**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/charvi52/finomaly-.git
   cd finomaly
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the local development server**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000) to launch the live application.

---

## 👥 Team Hackflux

* **Charvi Naresh**
* **Dolsi Bajaj**
* **Vasu Sharma**

---

## 📄 Research & Documentation

Download the full **1,000-Experiment Biometric Benchmark Report (PDF)** included in the repository at:  
`/Finomaly_Biometric_1000_Experiment_Report.pdf`

---

## 📜 Disclaimer

*Finomaly is an interactive research prototype developed for hackathon and experimental demonstration purposes. Commercial banking deployment requires secure server-side enrollment, regulatory compliance reviews, anti-spoofing verification, and independent security audits.*
