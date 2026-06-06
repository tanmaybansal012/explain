# 📈 Stock Portfolio Tracker — Backend API

A production-grade Node.js/Express REST API for tracking stock portfolios, computing P&L, generating buy/sell signals, and sending price-alert emails.

---

## 🗂 Project Description

Stock Portfolio Tracker is a backend service that lets users:

- **Manage portfolios** — create holdings, track buy price & quantity
- **Live P&L enrichment** — enrich any portfolio with current prices, unrealised gains, cost basis, and portfolio-level summaries
- **Price alerts** — set threshold alerts (ABOVE / BELOW) that trigger email notifications via Nodemailer
- **Technical signals** — compute moving averages, crossover signals, peaks/troughs, and best buy-sell windows using efficient O(n) algorithms
- **Ticker autocomplete** — O(m) prefix search using a Trie data structure, far faster than SQL `LIKE` scans
- **Secure auth** — JWT-based authentication with token expiry and user deactivation checks

---

## 📁 Project Structure

```
stock-portfolio-tracker/
│
├── config/
│   ├── logger.js          # Winston logger setup
│   └── db.js              # MongoDB / Sequelize connection
│
├── middleware/
│   ├── auth.js            # JWT auth middleware + generateToken()
│   └── errorHandler.js    # Centralised Express error handler + 404
│
├── models/
│   ├── User.js            # User schema (id, email, isActive, passwordHash)
│   ├── Portfolio.js       # Portfolio schema + getTickers() helper
│   ├── PriceHistory.js    # OHLCV price records + getLatestPrices()
│   └── Alert.js           # Price alert model (ticker, condition, threshold)
│
├── routes/
│   ├── authRoutes.js      # POST /auth/register, /auth/login
│   ├── portfolioRoutes.js # CRUD for portfolios and holdings
│   └── alertRoutes.js     # CRUD for price alerts
│
├── services/
│   ├── portfolioService.js  # enrichPortfolio(), portfolioPnLHistory()
│   ├── emailService.js      # sendAlertEmail() via Nodemailer
│   ├── signals.js           # Monotonic stack signals, sliding window max
│   ├── movingAvg.js         # Sliding window MA, crossover signals, bestBuySell
│   └── trie.js              # Trie autocomplete for ticker symbols
│
├── jobs/
│   └── alertChecker.js    # Scheduled job — checks alerts, fires emails
│
├── app.js                 # Express app setup
├── server.js              # Entry point — starts server
├── .env.example           # Environment variable template
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (or PostgreSQL if using Sequelize models)
- SMTP credentials (Mailtrap for dev, SendGrid/SES for production)

### Installation

```bash
git clone https://github.com/your-org/stock-portfolio-tracker.git
cd stock-portfolio-tracker
npm install
cp .env.example .env   # fill in your secrets
npm run dev
```

### Environment Variables

```env
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/stocktracker

# Auth
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASS=your_mailtrap_pass
EMAIL_FROM=alerts@stocktracker.com
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| POST   | `/api/auth/register` | Register a new user |
| POST   | `/api/auth/login`    | Login, returns JWT  |

### Portfolios *(requires Bearer token)*
| Method | Endpoint                                    | Description                         |
|--------|---------------------------------------------|-------------------------------------|
| GET    | `/api/portfolios`                           | List all portfolios (enriched)      |
| POST   | `/api/portfolios`                           | Create a portfolio                  |
| GET    | `/api/portfolios/:id`                       | Get enriched portfolio by ID        |
| DELETE | `/api/portfolios/:id`                       | Delete a portfolio                  |
| POST   | `/api/portfolios/:id/holdings`              | Add a holding                       |
| DELETE | `/api/portfolios/:id/holdings/:holdingId`   | Remove a holding                    |
| GET    | `/api/portfolios/:id/history?days=30`       | Daily P&L history (chart data)      |
| GET    | `/api/portfolios/:id/signals?ticker=AAPL`   | Buy/sell signals for a holding      |

### Alerts *(requires Bearer token)*
| Method | Endpoint          | Description            |
|--------|-------------------|------------------------|
| GET    | `/api/alerts`     | List user's alerts     |
| POST   | `/api/alerts`     | Create a price alert   |
| DELETE | `/api/alerts/:id` | Delete an alert        |

### Tickers
| Method | Endpoint                          | Description                   |
|--------|-----------------------------------|-------------------------------|
| GET    | `/api/tickers/search?q=APP`       | Autocomplete ticker symbols   |

---

## 🧠 Algorithm Design

| File              | Algorithm                  | Complexity | Why                                              |
|-------------------|----------------------------|------------|--------------------------------------------------|
| `movingAvg.js`    | Sliding Window             | O(n)       | 30× faster than naïve O(n·k) per-ticker MA      |
| `signals.js`      | Monotonic Stack            | O(n)       | O(n) next-greater vs O(n²) brute-force          |
| `signals.js`      | Sliding Window Max (deque) | O(n)       | k-day high resistance line in linear time       |
| `trie.js`         | Trie (Prefix Tree)         | O(m)       | O(m) prefix lookup vs O(n·m) SQL LIKE scan      |
| `portfolioService`| Single aggregation query   | O(t)       | One DB round-trip for all ticker prices         |

---

## 🛡 Security

- JWT verified on every protected route via `auth` middleware
- Deactivated users (`isActive: false`) are rejected even with valid tokens
- Centralised error handler hides stack traces in production (5xx → generic message)
- Mongoose duplicate-key and validation errors mapped to clean 400/409 responses

---

## 📧 Alert System

A background job (`jobs/alertChecker.js`) runs every 5 minutes:
1. Fetches all active alerts from the database
2. Loads latest prices from `PriceHistory`
3. Evaluates `ABOVE` / `BELOW` conditions
4. Calls `sendAlertEmail()` for triggered alerts (non-blocking — job continues on email failure)
5. Marks alerts as triggered to prevent duplicate emails

---

## 🧪 Testing

```bash
npm test          # Jest unit tests
npm run test:e2e  # Supertest integration tests
```

Key test targets: `movingAverage`, `crossoverSignals`, `bestBuySell`, `computeSignals`, `Trie.autocomplete`, `enrichPortfolio`.

---

## 📦 Dependencies

| Package      | Purpose                          |
|--------------|----------------------------------|
| express      | HTTP framework                   |
| jsonwebtoken | JWT sign & verify                |
| bcryptjs     | Password hashing                 |
| mongoose     | MongoDB ODM                      |
| nodemailer   | SMTP email delivery              |
| winston      | Structured logging               |
| node-cron    | Scheduled alert-checker job      |
| dotenv       | Environment variable loading     |

---

## License

MIT © 2024 Stock Portfolio Tracker

