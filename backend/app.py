from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from Mlpredictor import predict_stock
import yfinance as yf
import time
from typing import List

app = FastAPI(title="StockSense API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Caching for live market data to optimize load times and avoid rate limits
cache = {
    "indices": None,
    "indices_expiry": 0,
    "stocks": {},
    "stocks_expiry": 0
}
CACHE_DURATION = 300  # 5 minutes in seconds

class StockRequest(BaseModel):
    symbol: str

class BatchStockRequest(BaseModel):
    symbols: List[str]

def get_ticker_2d_stats(ticker_symbol):
    try:
        t = yf.Ticker(ticker_symbol)
        hist = t.history(period="5d")
        if not hist.empty and len(hist) >= 2:
            price = float(hist["Close"].iloc[-1])
            prev = float(hist["Close"].iloc[-2])
            change = ((price - prev) / prev) * 100
            return {"price": round(price, 2), "change": round(change, 2)}
    except Exception as e:
        print(f"Error fetching historical stats for {ticker_symbol}: {e}")
    return None

def get_live_indices():
    current_time = time.time()
    if cache["indices"] and current_time < cache["indices_expiry"]:
        return cache["indices"]
    
    sensex = get_ticker_2d_stats("^BSESN")
    nifty = get_ticker_2d_stats("^NSEI")
    
    indices_data = {}
    indices_data["sensex"] = sensex if sensex else {"price": 79486.32, "change": 0.0}
    indices_data["nifty"] = nifty if nifty else {"price": 24056.00, "change": 0.0}
        
    cache["indices"] = indices_data
    cache["indices_expiry"] = current_time + CACHE_DURATION
    return indices_data

def batch_fetch_stock_stats(symbols: List[str]):
    current_time = time.time()
    
    # If cache is valid, check if all symbols are present
    if cache["stocks"] and current_time < cache["stocks_expiry"]:
        missing_symbols = [s for s in symbols if s not in cache["stocks"]]
        if not missing_symbols:
            return {sym: cache["stocks"][sym] for sym in symbols}
    else:
        # Cache expired or not set, we will fetch all
        missing_symbols = symbols
        
    if missing_symbols:
        try:
            # yfinance download processes symbols in parallel
            df = yf.download(missing_symbols, period="5d")
            if "Close" in df.columns:
                close_df = df["Close"]
                stocks_data = {}
                
                if not hasattr(close_df, "columns"):
                    # single ticker downloaded
                    series = close_df.dropna()
                    if len(series) >= 2:
                        price = float(series.iloc[-1])
                        prev = float(series.iloc[-2])
                        change = ((price - prev) / prev) * 100
                        stocks_data[missing_symbols[0]] = {
                            "price": round(price, 2),
                            "change": round(change, 2)
                        }
                else:
                    # multiple tickers downloaded
                    for sym in missing_symbols:
                        if sym in close_df.columns:
                            series = close_df[sym].dropna()
                            if len(series) >= 2:
                                price = float(series.iloc[-1])
                                prev = float(series.iloc[-2])
                                change = ((price - prev) / prev) * 100
                                stocks_data[sym] = {
                                    "price": round(price, 2),
                                    "change": round(change, 2)
                                }
                
                if stocks_data:
                    cache["stocks"].update(stocks_data)
                    cache["stocks_expiry"] = current_time + CACHE_DURATION
        except Exception as e:
            print(f"Error in batch stock stats fetch: {e}")
            
    # Return whatever we have in cache for the requested symbols
    return {sym: cache["stocks"].get(sym, {"price": 0.0, "change": 0.0}) for sym in symbols}

@app.get("/")
def home():
    return {"message": "StockSense API is running"}

@app.post("/predict")
def predict(request: StockRequest):
    return predict_stock(request.symbol)

@app.get("/api/indices")
def get_indices():
    return get_live_indices()

@app.post("/api/stocks")
def get_stocks(request: BatchStockRequest):
    return batch_fetch_stock_stats(request.symbols)
