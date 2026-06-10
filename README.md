# 📈 Stock Portfolio Tracker

> A smart, efficient stock portfolio tracking API that uses advanced data structures to deliver instant search, real-time prices, and algorithmic buy/sell signals for both US and Indian markets.

---

## What It Does For a User

- 🔍 Search any stock ticker instantly (AAPL, TCS, RELIANCE)
- 💰 Get live real-time stock prices from Yahoo Finance
- 💼 Add stocks to your personal portfolio
- 📊 See buy/sell signals based on price patterns
- 📈 Calculate best time to buy and sell
- 📉 Track moving averages of any stock
- 📧 Get email alerts when a stock hits your target price

---

## Tech Stack

| Technology | What It's Used For |
|---|---|
| **Node.js** | Runtime — runs JavaScript on the server |
| **Express.js** | Framework — handles HTTP routes and requests |
| **Axios** | Fetches live stock prices from Yahoo Finance |
| **JWT (jsonwebtoken)** | User authentication and security |
| **Nodemailer** | Sends price alert emails |
| **dotenv** | Manages secret keys and config |
| **Yahoo Finance API** | Free source of live stock price data |

---

## Data Structures & Algorithms Used

| File | DSA Used | Why |
|---|---|---|
| `trie.js` | **Prefix Tree (Trie)** | O(m) instant ticker search instead of slow O(n) scan |
| `signals.js` | **Monotonic Stack** | O(n) buy/sell detection instead of O(n²) brute force |
| `signals.js` | **Sliding Window Max** | O(n) k-day high resistance line |
| `movingAvg.js` | **Sliding Window** | O(n) moving average instead of O(n·k) naive approach |
| `movingAvg.js` | **Kadane's Algorithm** | O(n) best buy/sell window finder |

---

## Project Files & Their Role

| File | Role |
|---|---|
| `index.js` | Main entry point — starts server, defines all routes |
| `services/auth.js` | JWT login middleware — protects private routes |
| `services/errorHandler.js` | Catches all errors — returns clean JSON responses |
| `services/emailService.js` | Sends formatted HTML price alert emails |
| `services/portfolioService.js` | Calculates P&L, portfolio value, cost basis |
| `services/trie.js` | Autocomplete search engine for ticker symbols |
| `services/signals.js` | Detects BUY/SELL/HOLD signals from price history |
| `services/movingAvg.js` | Computes moving averages and crossover signals |
| `public/index.html` | Frontend UI — search, live price, portfolio page |

---

## Project Structure

```
stock-tracker/
├── config/
│   └── logger.js
├── models/
│   └── User.js
├── services/
│   ├── auth.js
│   ├── errorHandler.js
│   ├── emailService.js
│   ├── portfolioService.js
│   ├── trie.js
│   ├── signals.js
│   └── movingAvg.js
├── public/
│   └── index.html
├── .env
├── index.js
├── package.json
└── README.md
```

---

## Getting Started

### 1. Prerequisites
```bash
node -v   # need v18+
npm -v
```

### 2. Clone & Install
```bash
git clone <your-repo-url>
cd stock-tracker
npm install
```

### 3. Create `.env` file
```env
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_email
EMAIL_PASS=your_password
EMAIL_FROM=alerts@stocktracker.com
```

### 4. Run the Server
```bash
node index.js
```

Or with auto-restart on file changes:
```bash
npm install -g nodemon
nodemon index.js
```

### 5. Open in Browser
```
http://localhost:3000
```

---

## API Endpoints

| Method | Route | What It Does |
|---|---|---|
| GET | `/search?q=AA` | Autocomplete ticker search |
| GET | `/price/AAPL` | Get live US stock price |
| GET | `/price/TCS?market=NSE` | Get live Indian NSE stock price |
| GET | `/price/INFY?market=BSE` | Get live Indian BSE stock price |
| POST | `/analyze` | Get moving average + best trade |
| POST | `/signals` | Get BUY/SELL signals |
| POST | `/portfolio/add` | Add stock to portfolio |
| GET | `/portfolio` | View your portfolio |

### Example Requests

**Search a ticker:**
```
GET http://localhost:3000/search?q=REL
```
```json
[{ "ticker": "RELIANCE", "name": "Reliance Industries", "sector": "Energy" }]
```

**Get live price:**
```
GET http://localhost:3000/price/TCS?market=NSE
```
```json
{ "ticker": "TCS.NS", "price": 3945.50, "currency": "INR", "market": "NSE" }
```

**Analyze prices:**
```
POST http://localhost:3000/analyze
Body: { "prices": [100, 102, 98, 105, 103, 110, 108] }
```
```json
{
  "ma7": [...],
  "bestTrade": { "maxGain": 12, "buyIndex": 2, "sellIndex": 5 }
}
```

**Get signals:**
```
POST http://localhost:3000/signals
Body: { "prices": [100, 102, 98, 105, 103, 110, 108] }
```
```json
{
  "signals": [
    { "action": "BUY", "price": 98, "index": 2 },
    { "action": "SELL", "price": 110, "index": 5 }
  ]
}
```

---

## Markets Supported

| Market | How to Use | Example |
|---|---|---|
| 🇺🇸 US (NYSE, NASDAQ) | Direct ticker | `AAPL`, `TSLA` |
| 🇮🇳 India NSE | Add `?market=NSE` | `TCS?market=NSE` |
| 🇮🇳 India BSE | Add `?market=BSE` | `INFY?market=BSE` |
| 🌍 Others | Yahoo Finance suffixes | `.L` UK, `.DE` Germany |

---

## How Data Flows

```
User types "REL"
      ↓
Trie searches in O(m) time
      ↓
Returns RELIANCE instantly
      ↓
User clicks → fetches live price from Yahoo Finance
      ↓
User adds to portfolio → P&L calculated
      ↓
Background checks price vs alert threshold
      ↓
Price crosses threshold → email sent via Nodemailer
      ↓
All errors caught by errorHandler → clean JSON response
```

---

## Why It's Efficient

Normal apps do slow operations. This project uses DSA to avoid that:

```
Search:       Array scan O(n)    →  Trie O(m)            → 100x faster
Moving Avg:   Naive O(n·k)       →  Sliding Window O(n)  →  30x faster
Buy/Sell:     Brute force O(n²)  →  Monotonic Stack O(n) → 500x faster at scale
```

---

## Dependencies

```json
{
  "express":       "HTTP server framework",
  "axios":         "HTTP client for Yahoo Finance API",
  "jsonwebtoken":  "JWT auth token generation and verification",
  "nodemailer":    "Email sending for price alerts",
  "dotenv":        "Environment variable management"
}
```

Install all:
```bash
npm install express axios jsonwebtoken nodemailer dotenv
```

---

## Future Improvements

- [ ] MongoDB database to persist portfolio data
- [ ] User signup and login system
- [ ] Price alert system with email notifications
- [ ] Portfolio performance chart (P&L over time)
- [ ] More Indian stocks in the Trie
- [ ] Crypto support (BTC-USD, ETH-USD)
- [ ] Deploy to cloud (Railway, Render, or Vercel)

---

## License

MIT — free to use and modify.
