# StockSense India: Quantitative Market Predictor

An AI-powered quantitative analysis and trend prediction platform for Indian equities (NSE & BSE). The application utilizes machine learning (Logistic Regression) to predict next-day price movements based on historical momentum, volatility, and volume indicators.

---

## 🚀 Live Links
* **Frontend Web Application (Netlify)**: [https://stocksense-india-markets.netlify.app](https://stocksense-india-markets.netlify.app)
* **Backend API Gateway (Render)**: [https://stock-predictor-gju5.onrender.com](https://stock-predictor-gju5.onrender.com)

---

## 🛠️ Technology Stack

### Frontend (User Interface)
* **Core**: Semantic HTML5 & Modern ES6 JavaScript.
* **Styling**: Vanilla CSS3 designed with a dark mode glassmorphic aesthetic (flexible grid/flex layouts, CSS custom properties, responsive clamp utilities, and hardware-accelerated animations).
* **Visualization**: [Chart.js](https://www.chartjs.org/) for real-time strategy returns comparison.
* **Effects**: HTML5 Canvas particle system for dynamic ambient background effects.

### Backend (Analytical Engine)
* **API Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+) with CORS middleware integrations.
* **Market Data Service**: [yfinance](https://github.com/ranarousihan/yfinance) for real-time and historical data fetching.
* **Machine Learning Pipeline**: [scikit-learn](https://scikit-learn.org/) (Logistic Regression).
* **Data Engineering**: [Pandas](https://pandas.pydata.org/) & [NumPy](https://numpy.org/).
* **Web Server**: [Uvicorn](https://www.uvicorn.org/).

---

## ✨ Features & Architecture

### 1. Live Market Indices Tracker
* Ticks live NSE Nifty 50 and BSE Sensex values, rendering percentage changes with color-coded flashing animations (green for gain, red for drop) to denote updates.
* Uses cache-controlled yfinance fetches on the backend to bypass API throttling.

### 2. Low-Latency Search Autocomplete
* Connects to a custom backend proxy (`/api/search`) which executes direct server-to-server calls to Yahoo Finance with fuzzy search queries.
* Robustly filters searches to **NSE** (`.NS` suffix) and **BSE** (`.BO` suffix) equity listings.
* Bypasses client-side CORS restrictions completely and speeds up lookup speeds down to milliseconds.

### 3. ML-Driven Trend Analysis
* Trains a machine learning model on 5 years of historical stock data.
* Engineering features include:
  * **Rolling Volatility** (5-day standard deviation of log returns).
  * **Relative Momentum** (10-day price changes relative to closing prices).
  * **Volume Surge Indicator** (1-day volume change percentage against rolling averages).
* Out-of-sample prediction calculates next-day signal output (**UP** or **DOWN**).
* Simulates historical cumulative returns comparing the **Model Strategy** against a simple **Buy & Hold** index strategy.

### 4. Interactive Performance Visualizer
* Generates a fully responsive Chart.js line graph mapping cumulative percentage returns of the model's strategy against passive buy-and-hold returns.

### 5. Market Leaderboard Dashboard
* High-speed catalog search interface mapping top Indian market capitalizations.
* Instant client-side filters searching by ticker symbol, corporate name, sector, or exchange.

---

## 📂 Project Structure

```text
NIFTY50/
├── backend/
│   ├── Mlpredictor.py        # Machine Learning model training & simulation pipeline
│   ├── app.py                # FastAPI endpoints & indices caching gateway
│   └── requirements.txt      # Python backend dependencies
├── frontend/
│   ├── index.html            # Core HTML layout & DOM hierarchy
│   ├── index.css             # Main responsive glassmorphic styles
│   ├── app.js                # Core JS logic, state routing, chart rendering
│   └── netlify.toml          # SPA client redirection configurations
├── render.yaml               # Infrastructure-as-Code configuration for Render
└── README.md                 # Detailed project description
```

---

## ⚙️ How to Setup & Run Locally

### Prerequisites
* Python 3.10+
* Node.js/npm (for static serving, optional)

### 1. Run the Analytical Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the development server:
   ```bash
   python -m uvicorn app:app --port 8000 --reload
   ```
The API documentation will be available at `http://localhost:8000/docs`.

### 2. Run the Web Frontend
1. Open a new terminal in the frontend directory:
   ```bash
   cd frontend
   ```
2. Serve the static files:
   ```bash
   python -m http.server 3000
   ```
3. Access the web app at `http://localhost:3000`.
