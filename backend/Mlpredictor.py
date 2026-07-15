import yfinance as yf
import numpy as np
from sklearn.linear_model import LogisticRegression 
from sklearn.model_selection import train_test_split 
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
def predict_stock(symbol):
    df = yf.download(symbol, start="2020-01-01")
    if df.empty:
        return {"error": "Invalid stock symbol or no historical data available."}
    
    # Handle yfinance MultiIndex columns if present in newer versions
    if df.columns.nlevels > 1:
        df.columns = df.columns.droplevel(1)
        
    if len(df) < 20:
        return {"error": "Insufficient historical data available for prediction."}
        
    df['returns'] = np.log(df['Close'].pct_change() + 1)
    df['direction'] = [1 if i > 0 else -1 for i in df['returns']]
    def lagit(df, lags):
        names = []
        for i in range(1, lags + 1):
            df[f'Lag_{i}'] = df['returns'].shift(i)          
            df[f'Lag_{i}_dir'] = np.sign(df[f'Lag_{i}'])     
            names.append(f'Lag_{i}')
            names.append(f'Lag_{i}_dir')
        df['volatility_5'] = df['returns'].rolling(5).std()
        df['momentum_5']  = df['returns'].rolling(5).sum()
        df['momentum_10'] = df['returns'].rolling(10).sum()
        if 'Volume' in df.columns:
            df['vol_change'] = df['Volume'].pct_change()
            names += ['volatility_5', 'momentum_5', 'momentum_10', 'vol_change']
        else:
            names += ['volatility_5', 'momentum_5', 'momentum_10']
        return names
    dfer=lagit(df,5)
    df.replace([np.inf, -np.inf], np.nan, inplace=True)  
    df.dropna(inplace=True)
    model =LogisticRegression(C=0.01, max_iter=1000)
    train,test=train_test_split(df,shuffle=False,test_size=0.25,random_state=0)
    train=train.copy()
    test=test.copy()
    scaler = StandardScaler()
    X_train = scaler.fit_transform(train[dfer]) 
    X_test  = scaler.transform(test[dfer])
    model.fit(X_train, train['direction'])
    test["Prediction"] = model.predict(X_test)
    test["stat"] = test["Prediction"] * test["returns"]
    accuracy = accuracy_score(test["direction"], test["Prediction"])
    latest = df[dfer].iloc[[-1]]
    latest_scaled = scaler.transform(latest)
    prediction = model.predict(latest_scaled)[0]
    confidence = model.predict_proba(latest_scaled).max()
    current_price = float(df["Close"].iloc[-1])
    latest_vol = float(df['volatility_5'].iloc[-1])
    latest_mom = float(df['momentum_10'].iloc[-1])
    latest_vc = float(df['vol_change'].iloc[-1]) if 'vol_change' in df.columns else 0.0

    graph_df = df.reset_index()[["Date", "Close"]].copy()
    # Newer yfinance returns timezone-aware DatetimeIndex; normalize to plain date string
    if hasattr(graph_df["Date"].iloc[0], 'tz_localize') or str(graph_df["Date"].dtype).startswith("datetime64[ns,"):
        graph_df["Date"] = graph_df["Date"].dt.tz_localize(None)
    graph_df["Date"] = graph_df["Date"].dt.strftime("%Y-%m-%d")
    graph = graph_df.to_dict(orient="records")
    
    return {
        "symbol": symbol,
        "prediction": int(prediction),
        "prediction_text": "UP" if prediction == 1 else "DOWN",
        "confidence": round(confidence * 100, 2),
        "accuracy": round(accuracy * 100, 2),
        "current_price": round(current_price, 2),
        "volatility": round(latest_vol, 4),
        "momentum": round(latest_mom, 4),
        "vol_change": round(latest_vc * 100, 2),
        "graph": graph
    }
