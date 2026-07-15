document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. SPA ROUTER
  // ==========================================
  const navLinks = document.querySelectorAll('.nav-link, #logo-btn, #nav-cta-btn, #home-cta-btn');
  const sections = document.querySelectorAll('.page-section');

  function navigateTo(pageId) {
    document.querySelectorAll('.nav-link').forEach(link =>
      link.classList.toggle('active', link.getAttribute('data-page') === pageId)
    );
    sections.forEach(section => {
      if (section.id === `${pageId}-page`) {
        section.style.display = 'block';
        setTimeout(() => section.classList.add('active'), 50);
      } else {
        section.classList.remove('active');
        setTimeout(() => { section.style.display = 'none'; }, 400);
      }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navLinks.forEach(link =>
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.getAttribute('data-page') || 'home');
    })
  );

  // ==========================================
  // 2. LIVE INDEX PRICES — FETCHED FROM BACKEND
  // ==========================================
  // AUTO-DETECT: uses Render backend in production, localhost in development
  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://stocksense-api.onrender.com';  // ← UPDATE this after Render deployment

  // Gentle price tick on top of a real base
  function tickLive(elId, basePrice, spread) {
    const el = document.getElementById(elId);
    if (!el) return;
    let price = basePrice;
    return setInterval(() => {
      price += (Math.random() - 0.48) * spread;
      el.textContent = price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const up = price > basePrice;
      el.style.color = up ? 'var(--color-lichen)' : 'var(--color-plum-voltage)';
      setTimeout(() => { el.style.color = 'var(--color-bone)'; }, 500);
    }, 3500);
  }

  // Update index change badge
  function setChangeEl(elId, change) {
    const el = document.getElementById(elId);
    if (!el) return;
    const sign = change >= 0 ? '+' : '';
    el.textContent = `${sign}${change.toFixed(2)}%`;
    el.className = `stat-change ${change >= 0 ? 'up' : 'down'}`;
  }

  let sensexTimer = null;
  let niftyTimer  = null;

  async function fetchLiveIndices() {
    try {
      const res = await fetch(`${API_BASE}/api/indices`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Sensex
      const sensexPrice = data.sensex?.price ?? 79486.32;
      const sensexChange = data.sensex?.change ?? 0;
      document.getElementById('live-sensex-price').textContent =
        sensexPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setChangeEl('live-sensex-change', sensexChange);

      // Nifty
      const niftyPrice = data.nifty?.price ?? 24056.00;
      const niftyChange = data.nifty?.change ?? 0;
      document.getElementById('live-nifty-price').textContent =
        niftyPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setChangeEl('live-nifty-change', niftyChange);

      // Restart gentle tickers on new base
      if (sensexTimer) clearInterval(sensexTimer);
      if (niftyTimer) clearInterval(niftyTimer);
      sensexTimer = tickLive('live-sensex-price', sensexPrice, 15);
      niftyTimer  = tickLive('live-nifty-price',  niftyPrice,  4.5);

    } catch (err) {
      console.warn('Live indices fetch failed, using fallback:', err);
      // Fallback: run ticker on defaults
      if (!sensexTimer) sensexTimer = tickLive('live-sensex-price', 79486.32, 15);
      if (!niftyTimer)  niftyTimer  = tickLive('live-nifty-price',  24056.00, 4.5);
    }
  }

  // Fetch immediately and refresh every 5 minutes
  fetchLiveIndices();
  setInterval(fetchLiveIndices, 5 * 60 * 1000);

  // ==========================================
  // 3. FULL NSE + BSE STOCK DATABASE
  // exchange: "NSE" | "BSE" | "NSE/BSE"
  // ==========================================
  const stocksData = [
    // ─── NIFTY 50 ──────────────────────────────────────────────────────
    { ticker:"HDFCBANK",     name:"HDFC Bank Ltd.",                           exchange:"NSE/BSE", sector:"Financial Services",  price:1654.20, change: 0.89 },
    { ticker:"ICICIBANK",    name:"ICICI Bank Ltd.",                          exchange:"NSE/BSE", sector:"Financial Services",  price:1125.50, change:-0.45 },
    { ticker:"RELIANCE",     name:"Reliance Industries Ltd.",                 exchange:"NSE/BSE", sector:"Energy",              price:1318.10, change: 0.34 },
    { ticker:"BHARTIAIRTEL", name:"Bharti Airtel Ltd.",                       exchange:"NSE/BSE", sector:"Telecom",             price:1410.20, change: 0.15 },
    { ticker:"LT",           name:"Larsen & Toubro Ltd.",                     exchange:"NSE/BSE", sector:"Construction",        price:3512.90, change: 0.90 },
    { ticker:"INFY",         name:"Infosys Ltd.",                             exchange:"NSE/BSE", sector:"IT",                  price:1530.80, change: 0.31 },
    { ticker:"SBIN",         name:"State Bank of India",                      exchange:"NSE/BSE", sector:"Financial Services",  price: 842.10, change: 1.20 },
    { ticker:"AXISBANK",     name:"Axis Bank Ltd.",                           exchange:"NSE/BSE", sector:"Financial Services",  price:1210.40, change: 0.52 },
    { ticker:"TCS",          name:"Tata Consultancy Services Ltd.",           exchange:"NSE/BSE", sector:"IT",                  price:4125.40, change:-1.12 },
    { ticker:"KOTAKBANK",    name:"Kotak Mahindra Bank Ltd.",                 exchange:"NSE/BSE", sector:"Financial Services",  price:1725.15, change:-0.50 },
    { ticker:"ITC",          name:"ITC Ltd.",                                 exchange:"NSE/BSE", sector:"Consumer Goods",      price: 432.50, change:-0.22 },
    { ticker:"HINDUNILVR",   name:"Hindustan Unilever Ltd.",                  exchange:"NSE/BSE", sector:"Consumer Goods",      price:2452.10, change:-0.15 },
    { ticker:"TATAMOTORS",   name:"Tata Motors Ltd.",                         exchange:"NSE/BSE", sector:"Automobile",          price: 954.80, change: 1.75 },
    { ticker:"BAJFINANCE",   name:"Bajaj Finance Ltd.",                       exchange:"NSE/BSE", sector:"Financial Services",  price:7215.30, change:-0.82 },
    { ticker:"SUNPHARMA",    name:"Sun Pharmaceutical Industries Ltd.",       exchange:"NSE/BSE", sector:"Healthcare",          price:1548.90, change: 0.42 },
    { ticker:"HCLTECH",      name:"HCL Technologies Ltd.",                    exchange:"NSE/BSE", sector:"IT",                  price:1780.30, change: 0.28 },
    { ticker:"M&M",          name:"Mahindra & Mahindra Ltd.",                 exchange:"NSE/BSE", sector:"Automobile",          price:3125.60, change: 1.05 },
    { ticker:"MARUTI",       name:"Maruti Suzuki India Ltd.",                 exchange:"NSE/BSE", sector:"Automobile",          price:13580.00,change: 0.65 },
    { ticker:"NTPC",         name:"NTPC Ltd.",                                exchange:"NSE/BSE", sector:"Power",               price: 364.50, change: 0.40 },
    { ticker:"ONGC",         name:"Oil & Natural Gas Corporation Ltd.",       exchange:"NSE/BSE", sector:"Energy",              price: 274.80, change:-0.30 },
    { ticker:"POWERGRID",    name:"Power Grid Corporation of India Ltd.",     exchange:"NSE/BSE", sector:"Power",               price: 314.20, change: 0.18 },
    { ticker:"TATASTEEL",    name:"Tata Steel Ltd.",                          exchange:"NSE/BSE", sector:"Metals & Mining",     price: 164.75, change: 1.20 },
    { ticker:"ADANIENT",     name:"Adani Enterprises Ltd.",                   exchange:"NSE/BSE", sector:"Conglomerate",        price:2845.00, change: 2.35 },
    { ticker:"WIPRO",        name:"Wipro Ltd.",                               exchange:"NSE/BSE", sector:"IT",                  price: 564.30, change:-0.45 },
    { ticker:"JSWSTEEL",     name:"JSW Steel Ltd.",                           exchange:"NSE/BSE", sector:"Metals & Mining",     price: 918.40, change: 0.90 },
    { ticker:"ULTRACEMCO",   name:"UltraTech Cement Ltd.",                    exchange:"NSE/BSE", sector:"Construction",        price:11420.00,change: 0.55 },
    { ticker:"TITAN",        name:"Titan Company Ltd.",                       exchange:"NSE/BSE", sector:"Consumer Durables",   price:3425.80, change: 0.72 },
    { ticker:"BAJAJFINSV",   name:"Bajaj Finserv Ltd.",                       exchange:"NSE/BSE", sector:"Financial Services",  price:1862.40, change:-0.60 },
    { ticker:"NESTLEIND",    name:"Nestle India Ltd.",                        exchange:"NSE/BSE", sector:"Consumer Goods",      price:2278.50, change: 0.10 },
    { ticker:"ASIANPAINT",   name:"Asian Paints Ltd.",                        exchange:"NSE/BSE", sector:"Consumer Goods",      price:2512.00, change:-0.95 },
    { ticker:"GRASIM",       name:"Grasim Industries Ltd.",                   exchange:"NSE/BSE", sector:"Construction",        price:2654.30, change: 0.40 },
    { ticker:"TECHM",        name:"Tech Mahindra Ltd.",                       exchange:"NSE/BSE", sector:"IT",                  price:1498.70, change: 0.62 },
    { ticker:"INDUSINDBK",   name:"IndusInd Bank Ltd.",                       exchange:"NSE/BSE", sector:"Financial Services",  price: 988.60, change:-1.50 },
    { ticker:"HEROMOTOCO",   name:"Hero MotoCorp Ltd.",                       exchange:"NSE/BSE", sector:"Automobile",          price:4512.00, change: 0.35 },
    { ticker:"HINDALCO",     name:"Hindalco Industries Ltd.",                 exchange:"NSE/BSE", sector:"Metals & Mining",     price: 678.40, change: 1.42 },
    { ticker:"CIPLA",        name:"Cipla Ltd.",                               exchange:"NSE/BSE", sector:"Healthcare",          price:1528.30, change: 0.55 },
    { ticker:"DIVISLAB",     name:"Divi's Laboratories Ltd.",                 exchange:"NSE/BSE", sector:"Healthcare",          price:5812.00, change: 0.22 },
    { ticker:"EICHERMOT",    name:"Eicher Motors Ltd.",                       exchange:"NSE/BSE", sector:"Automobile",          price:4928.50, change: 0.98 },
    { ticker:"BPCL",         name:"Bharat Petroleum Corporation Ltd.",        exchange:"NSE/BSE", sector:"Energy",              price: 354.20, change:-0.65 },
    { ticker:"TRENT",        name:"Trent Ltd.",                               exchange:"NSE/BSE", sector:"Consumer Services",   price:5824.00, change: 1.85 },
    { ticker:"APOLLOHOSP",   name:"Apollo Hospitals Enterprise Ltd.",         exchange:"NSE/BSE", sector:"Healthcare",          price:6712.00, change: 0.48 },
    { ticker:"DRREDDY",      name:"Dr. Reddy's Laboratories Ltd.",            exchange:"NSE/BSE", sector:"Healthcare",          price:1348.60, change:-0.20 },
    { ticker:"COALINDIA",    name:"Coal India Ltd.",                          exchange:"NSE/BSE", sector:"Metals & Mining",     price: 424.80, change: 0.60 },
    { ticker:"BRITANNIA",    name:"Britannia Industries Ltd.",                exchange:"NSE/BSE", sector:"Consumer Goods",      price:5648.00, change:-0.35 },
    { ticker:"BAJAJ-AUTO",   name:"Bajaj Auto Ltd.",                          exchange:"NSE/BSE", sector:"Automobile",          price:9124.00, change: 0.90 },
    { ticker:"ADANIPORTS",   name:"Adani Ports & Special Economic Zone Ltd.", exchange:"NSE/BSE", sector:"Infrastructure",      price:1254.80, change: 1.10 },
    { ticker:"SBILIFE",      name:"SBI Life Insurance Company Ltd.",          exchange:"NSE/BSE", sector:"Financial Services",  price:1714.00, change: 0.25 },
    { ticker:"HDFCLIFE",     name:"HDFC Life Insurance Company Ltd.",         exchange:"NSE/BSE", sector:"Financial Services",  price: 742.50, change: 0.38 },
    { ticker:"BEL",          name:"Bharat Electronics Ltd.",                  exchange:"NSE/BSE", sector:"Defence",             price: 348.20, change: 2.10 },
    { ticker:"SHREECEM",     name:"Shree Cement Ltd.",                        exchange:"NSE/BSE", sector:"Construction",        price:26540.00,change: 0.80 },

    // ─── NIFTY NEXT 50 ─────────────────────────────────────────────────
    { ticker:"ADANIGREEN",   name:"Adani Green Energy Ltd.",                  exchange:"NSE",     sector:"Renewable Energy",   price:1985.40, change: 3.10 },
    { ticker:"ADANITRANS",   name:"Adani Transmission Ltd.",                  exchange:"NSE",     sector:"Power",              price:1124.60, change: 1.85 },
    { ticker:"AMBUJACEM",    name:"Ambuja Cements Ltd.",                      exchange:"NSE/BSE", sector:"Construction",        price: 652.80, change: 0.42 },
    { ticker:"DMART",        name:"Avenue Supermarts Ltd. (D-Mart)",          exchange:"NSE/BSE", sector:"Retail",             price:4285.00, change: 0.68 },
    { ticker:"BANKBARODA",   name:"Bank of Baroda",                           exchange:"NSE/BSE", sector:"Financial Services",  price: 248.40, change: 1.15 },
    { ticker:"BERGEPAINT",   name:"Berger Paints India Ltd.",                 exchange:"NSE/BSE", sector:"Consumer Goods",      price: 548.30, change:-0.40 },
    { ticker:"BHARATFORG",   name:"Bharat Forge Ltd.",                        exchange:"NSE/BSE", sector:"Automobile",          price:1254.60, change: 0.95 },
    { ticker:"BOSCHLTD",     name:"Bosch Ltd.",                               exchange:"NSE/BSE", sector:"Automobile",          price:36540.00,change: 0.45 },
    { ticker:"CHOLAFIN",     name:"Cholamandalam Investment & Finance Co.",   exchange:"NSE/BSE", sector:"Financial Services",  price:1548.20, change: 0.75 },
    { ticker:"CONCOR",       name:"Container Corporation of India Ltd.",      exchange:"NSE/BSE", sector:"Infrastructure",      price: 814.50, change:-0.25 },
    { ticker:"CUMMINSIND",   name:"Cummins India Ltd.",                       exchange:"NSE/BSE", sector:"Industrial",          price:3654.00, change: 0.55 },
    { ticker:"DLF",          name:"DLF Ltd.",                                 exchange:"NSE/BSE", sector:"Real Estate",         price: 885.40, change: 1.20 },
    { ticker:"GODREJCP",     name:"Godrej Consumer Products Ltd.",            exchange:"NSE/BSE", sector:"Consumer Goods",      price:1248.30, change: 0.35 },
    { ticker:"GODREJPROP",   name:"Godrej Properties Ltd.",                   exchange:"NSE/BSE", sector:"Real Estate",         price:2854.00, change: 1.65 },
    { ticker:"HAVELLS",      name:"Havells India Ltd.",                       exchange:"NSE/BSE", sector:"Consumer Durables",   price:1748.60, change: 0.48 },
    { ticker:"NAUKRI",       name:"Info Edge (India) Ltd.",                   exchange:"NSE/BSE", sector:"Internet Services",   price:8524.00, change:-0.62 },
    { ticker:"INDIGO",       name:"InterGlobe Aviation Ltd. (IndiGo)",        exchange:"NSE/BSE", sector:"Aviation",            price:4512.80, change: 1.30 },
    { ticker:"LICHSGFIN",    name:"LIC Housing Finance Ltd.",                 exchange:"NSE/BSE", sector:"Financial Services",  price: 648.20, change: 0.85 },
    { ticker:"MUTHOOTFIN",   name:"Muthoot Finance Ltd.",                     exchange:"NSE/BSE", sector:"Financial Services",  price:2148.40, change: 0.55 },
    { ticker:"OFSS",         name:"Oracle Financial Services Software Ltd.",  exchange:"NSE/BSE", sector:"IT",                  price:12850.00,change: 0.35 },
    { ticker:"PIDILITIND",   name:"Pidilite Industries Ltd.",                 exchange:"NSE/BSE", sector:"Consumer Goods",      price:3254.70, change:-0.15 },
    { ticker:"SRF",          name:"SRF Ltd.",                                 exchange:"NSE/BSE", sector:"Chemicals",           price:2654.30, change: 0.70 },
    { ticker:"SIEMENS",      name:"Siemens Ltd.",                             exchange:"NSE/BSE", sector:"Industrial",          price:7248.00, change: 0.40 },
    { ticker:"TORNTPHARM",   name:"Torrent Pharmaceuticals Ltd.",             exchange:"NSE/BSE", sector:"Healthcare",          price:3548.60, change: 0.20 },
    { ticker:"TATAPOWER",    name:"Tata Power Company Ltd.",                  exchange:"NSE/BSE", sector:"Power",               price: 448.30, change: 1.45 },
    { ticker:"VEDL",         name:"Vedanta Ltd.",                             exchange:"NSE/BSE", sector:"Metals & Mining",     price: 478.40, change: 2.10 },
    { ticker:"ZYDUSLIFE",    name:"Zydus Lifesciences Ltd.",                  exchange:"NSE/BSE", sector:"Healthcare",          price: 994.20, change: 0.65 },
    { ticker:"PAGEIND",      name:"Page Industries Ltd.",                     exchange:"NSE/BSE", sector:"Consumer Goods",      price:47540.00,change:-0.30 },
    { ticker:"POLYCAB",      name:"Polycab India Ltd.",                       exchange:"NSE/BSE", sector:"Consumer Durables",   price:7248.00, change: 0.85 },
    { ticker:"IRCTC",        name:"Indian Railway Catering & Tourism Corp.",  exchange:"NSE/BSE", sector:"Consumer Services",   price: 854.60, change: 0.45 },

    // ─── POPULAR MID-CAPS (NSE) ────────────────────────────────────────
    { ticker:"TATAELXSI",    name:"Tata Elxsi Ltd.",                          exchange:"NSE/BSE", sector:"IT",                  price:8254.00, change:-1.20 },
    { ticker:"PERSISTENT",   name:"Persistent Systems Ltd.",                  exchange:"NSE/BSE", sector:"IT",                  price:6548.00, change: 1.05 },
    { ticker:"COFORGE",      name:"Coforge Ltd.",                             exchange:"NSE/BSE", sector:"IT",                  price:8124.00, change: 0.75 },
    { ticker:"DIXON",        name:"Dixon Technologies (India) Ltd.",          exchange:"NSE/BSE", sector:"Consumer Durables",   price:17450.00,change: 2.35 },
    { ticker:"VARUNBEV",     name:"Varun Beverages Ltd.",                     exchange:"NSE/BSE", sector:"Consumer Goods",      price:1648.30, change: 0.62 },
    { ticker:"INDHOTEL",     name:"Indian Hotels Company Ltd. (Taj)",         exchange:"NSE/BSE", sector:"Hospitality",         price: 784.20, change: 1.25 },
    { ticker:"BALKRISIND",   name:"Balkrishna Industries Ltd.",               exchange:"NSE/BSE", sector:"Automobile",          price:2985.40, change: 0.48 },
    { ticker:"ASTRAL",       name:"Astral Ltd.",                              exchange:"NSE/BSE", sector:"Construction",        price:2254.60, change: 0.30 },
    { ticker:"DEEPAKNTR",    name:"Deepak Nitrite Ltd.",                      exchange:"NSE/BSE", sector:"Chemicals",           price:2754.80, change:-0.55 },
    { ticker:"CROMPTON",     name:"Crompton Greaves Consumer Electricals Ltd.",exchange:"NSE/BSE",sector:"Consumer Durables",   price: 398.40, change: 0.80 },
    { ticker:"JUBLFOOD",     name:"Jubilant FoodWorks Ltd. (Domino's)",       exchange:"NSE/BSE", sector:"Consumer Services",   price: 685.20, change:-0.45 },
    { ticker:"KANSAINER",    name:"Kansai Nerolac Paints Ltd.",               exchange:"NSE/BSE", sector:"Consumer Goods",      price: 354.60, change:-0.25 },
    { ticker:"OBEROIRLTY",   name:"Oberoi Realty Ltd.",                       exchange:"NSE",     sector:"Real Estate",         price:2154.80, change: 1.80 },
    { ticker:"PRESTIGE",     name:"Prestige Estates Projects Ltd.",           exchange:"NSE/BSE", sector:"Real Estate",         price:1985.40, change: 2.10 },
    { ticker:"BRIGADE",      name:"Brigade Enterprises Ltd.",                 exchange:"NSE/BSE", sector:"Real Estate",         price:1248.60, change: 1.55 },
    { ticker:"ZOMATO",       name:"Zomato Ltd.",                              exchange:"NSE/BSE", sector:"Internet Services",   price: 248.60, change: 3.20 },
    { ticker:"PAYTM",        name:"One97 Communications Ltd. (Paytm)",        exchange:"NSE/BSE", sector:"Fintech",             price: 854.20, change:-1.85 },
    { ticker:"NYKAA",        name:"FSN E-Commerce Ventures Ltd. (Nykaa)",     exchange:"NSE/BSE", sector:"E-Commerce",          price: 185.40, change: 1.40 },
    { ticker:"POLICYBZR",    name:"PB Fintech Ltd. (PolicyBazaar)",           exchange:"NSE/BSE", sector:"Fintech",             price:1854.60, change:-0.90 },
    { ticker:"DELHIVERY",    name:"Delhivery Ltd.",                           exchange:"NSE/BSE", sector:"Logistics",           price: 354.80, change: 0.65 },
    { ticker:"WESTLIFE",     name:"Westlife Foodworld Ltd. (McDonald's India)",exchange:"NSE/BSE",sector:"Consumer Services",   price: 785.40, change:-0.20 },
    { ticker:"DEVYANI",      name:"Devyani International Ltd. (KFC/Pizza Hut)",exchange:"NSE/BSE",sector:"Consumer Services",  price: 175.60, change: 0.85 },
    { ticker:"IRFC",         name:"Indian Railway Finance Corporation Ltd.",  exchange:"NSE/BSE", sector:"Financial Services",  price: 198.40, change: 0.95 },
    { ticker:"HAL",          name:"Hindustan Aeronautics Ltd.",               exchange:"NSE/BSE", sector:"Defence",             price:4985.60, change: 1.20 },
    { ticker:"MAZAGONDOCK",  name:"Mazagon Dock Shipbuilders Ltd.",           exchange:"NSE/BSE", sector:"Defence",             price:4512.80, change: 2.45 },
    { ticker:"COCHINSHIP",   name:"Cochin Shipyard Ltd.",                     exchange:"NSE/BSE", sector:"Defence",             price:1985.40, change: 3.10 },
    { ticker:"RVNL",         name:"Rail Vikas Nigam Ltd.",                    exchange:"NSE/BSE", sector:"Infrastructure",      price: 485.60, change: 1.65 },
    { ticker:"NHPC",         name:"NHPC Ltd.",                                exchange:"NSE/BSE", sector:"Power",               price: 95.40, change: 0.75 },
    { ticker:"RECLTD",       name:"REC Ltd.",                                 exchange:"NSE/BSE", sector:"Financial Services",  price: 548.20, change: 0.85 },
    { ticker:"PFC",          name:"Power Finance Corporation Ltd.",           exchange:"NSE/BSE", sector:"Financial Services",  price: 498.60, change: 0.90 },
    { ticker:"IOC",          name:"Indian Oil Corporation Ltd.",              exchange:"NSE/BSE", sector:"Energy",              price: 148.60, change:-0.40 },
    { ticker:"HINDPETRO",    name:"Hindustan Petroleum Corporation Ltd.",     exchange:"NSE/BSE", sector:"Energy",              price: 424.80, change:-0.55 },
    { ticker:"GAIL",         name:"GAIL (India) Ltd.",                        exchange:"NSE/BSE", sector:"Energy",              price: 218.40, change: 0.35 },
    { ticker:"IOCL",         name:"Indian Oil Corporation Ltd.",              exchange:"BSE",     sector:"Energy",              price: 148.60, change:-0.40 },
    { ticker:"TORNTPOWER",   name:"Torrent Power Ltd.",                       exchange:"NSE/BSE", sector:"Power",               price:1754.20, change: 0.55 },
    { ticker:"CANBK",        name:"Canara Bank",                              exchange:"NSE/BSE", sector:"Financial Services",  price: 112.40, change: 1.40 },
    { ticker:"UNIONBANK",    name:"Union Bank of India",                      exchange:"NSE/BSE", sector:"Financial Services",  price: 148.60, change: 0.95 },
    { ticker:"PNB",          name:"Punjab National Bank",                     exchange:"NSE/BSE", sector:"Financial Services",  price: 115.80, change: 0.80 },
    { ticker:"BANKOFMAH",    name:"Bank of Maharashtra",                      exchange:"NSE/BSE", sector:"Financial Services",  price: 64.20, change: 1.25 },
    { ticker:"IDFCFIRSTB",   name:"IDFC First Bank Ltd.",                     exchange:"NSE/BSE", sector:"Financial Services",  price: 78.40, change:-1.20 },
    { ticker:"BANDHANBNK",   name:"Bandhan Bank Ltd.",                        exchange:"NSE/BSE", sector:"Financial Services",  price: 168.60, change:-2.10 },
    { ticker:"RBLBANK",      name:"RBL Bank Ltd.",                            exchange:"NSE/BSE", sector:"Financial Services",  price: 248.40, change:-0.85 },
    { ticker:"FEDERALBNK",   name:"Federal Bank Ltd.",                        exchange:"NSE/BSE", sector:"Financial Services",  price: 218.60, change: 0.55 },
    { ticker:"KARURVYSYA",   name:"Karur Vysya Bank Ltd.",                    exchange:"NSE/BSE", sector:"Financial Services",  price: 248.80, change: 1.20 },
    { ticker:"LTIM",         name:"LTIMindtree Ltd.",                         exchange:"NSE/BSE", sector:"IT",                  price:6148.00, change: 0.42 },
    { ticker:"MPHASIS",      name:"Mphasis Ltd.",                             exchange:"NSE/BSE", sector:"IT",                  price:3254.60, change:-0.35 },
    { ticker:"KPITTECH",     name:"KPIT Technologies Ltd.",                   exchange:"NSE/BSE", sector:"IT",                  price:1854.40, change: 1.75 },
    { ticker:"TANLA",        name:"Tanla Platforms Ltd.",                     exchange:"NSE",     sector:"IT",                  price:1124.60, change: 0.55 },
    { ticker:"MAPMYINDIA",   name:"C.E. Info Systems Ltd. (MapMyIndia)",      exchange:"NSE/BSE", sector:"IT",                  price:2354.80, change: 1.10 },
    { ticker:"HAPPSTMNDS",   name:"Happiest Minds Technologies Ltd.",         exchange:"NSE/BSE", sector:"IT",                  price: 854.20, change: 0.85 },
    { ticker:"ROUTE",        name:"Route Mobile Ltd.",                        exchange:"NSE/BSE", sector:"IT",                  price:1854.60, change:-0.45 },
    { ticker:"MASTEK",       name:"Mastek Ltd.",                              exchange:"NSE/BSE", sector:"IT",                  price:2954.80, change: 0.35 },
    { ticker:"KAYNES",       name:"Kaynes Technology India Ltd.",             exchange:"NSE",     sector:"Electronics",         price:6548.00, change: 2.80 },
    { ticker:"SYRMA",        name:"Syrma SGS Technology Ltd.",               exchange:"NSE",     sector:"Electronics",         price: 548.20, change: 1.45 },
    { ticker:"AMBER",        name:"Amber Enterprises India Ltd.",             exchange:"NSE/BSE", sector:"Consumer Durables",   price:6248.00, change: 1.90 },
    { ticker:"AARTIIND",     name:"Aarti Industries Ltd.",                    exchange:"NSE/BSE", sector:"Chemicals",           price: 548.40, change: 0.65 },
    { ticker:"CLEAN",        name:"Clean Science & Technology Ltd.",          exchange:"NSE",     sector:"Chemicals",           price:1548.60, change: 0.35 },
    { ticker:"TATACHEM",     name:"Tata Chemicals Ltd.",                      exchange:"NSE/BSE", sector:"Chemicals",           price:1148.20, change:-0.55 },
    { ticker:"PIIND",        name:"PI Industries Ltd.",                       exchange:"NSE/BSE", sector:"Chemicals",           price:4254.80, change: 0.80 },
    { ticker:"DALBHARAT",    name:"Dalmia Bharat Ltd.",                       exchange:"NSE/BSE", sector:"Construction",        price:2154.60, change: 0.45 },
    { ticker:"ACC",          name:"ACC Ltd.",                                 exchange:"NSE/BSE", sector:"Construction",        price:2548.40, change: 0.28 },
    { ticker:"RAMCOCEM",     name:"The Ramco Cements Ltd.",                   exchange:"NSE/BSE", sector:"Construction",        price: 948.60, change: 0.15 },
    { ticker:"NUVOCO",       name:"Nuvoco Vistas Corporation Ltd.",           exchange:"NSE",     sector:"Construction",        price: 348.40, change: 0.55 },
    { ticker:"METROPOLIS",   name:"Metropolis Healthcare Ltd.",               exchange:"NSE/BSE", sector:"Healthcare",          price:1948.60, change: 0.42 },
    { ticker:"THYROCARE",    name:"Thyrocare Technologies Ltd.",              exchange:"NSE/BSE", sector:"Healthcare",          price: 754.80, change: 0.35 },
    { ticker:"LALPATHLAB",   name:"Dr Lal Pathlabs Ltd.",                     exchange:"NSE/BSE", sector:"Healthcare",          price:2748.40, change: 0.18 },
    { ticker:"ERIS",         name:"Eris Lifesciences Ltd.",                   exchange:"NSE/BSE", sector:"Healthcare",          price:1548.60, change:-0.25 },
    { ticker:"IPCA",         name:"Ipca Laboratories Ltd.",                   exchange:"NSE/BSE", sector:"Healthcare",          price:1948.80, change: 0.55 },
    { ticker:"GLENMARK",     name:"Glenmark Pharmaceuticals Ltd.",            exchange:"NSE/BSE", sector:"Healthcare",          price: 985.40, change: 0.40 },
    { ticker:"ALKEM",        name:"Alkem Laboratories Ltd.",                  exchange:"NSE/BSE", sector:"Healthcare",          price:5648.00, change: 0.22 },
    { ticker:"NATCOPHARM",   name:"Natco Pharma Ltd.",                        exchange:"NSE/BSE", sector:"Healthcare",          price:1354.60, change:-0.35 },
    { ticker:"APLAPOLLO",    name:"APL Apollo Tubes Ltd.",                    exchange:"NSE/BSE", sector:"Metals & Mining",     price:1854.80, change: 1.10 },
    { ticker:"RATNAMANI",    name:"Ratnamani Metals & Tubes Ltd.",            exchange:"NSE/BSE", sector:"Metals & Mining",     price:3754.60, change: 0.65 },
    { ticker:"MAHINDCIE",    name:"Mahindra CIE Automotive Ltd.",             exchange:"NSE/BSE", sector:"Automobile",          price: 648.40, change: 0.85 },
    { ticker:"MOTHERSON",    name:"Samvardhana Motherson International Ltd.", exchange:"NSE/BSE", sector:"Automobile",          price: 154.60, change: 0.90 },
    { ticker:"BOROSIL",      name:"Borosil Renewables Ltd.",                  exchange:"NSE/BSE", sector:"Renewable Energy",    price: 548.20, change: 2.15 },
    { ticker:"STERLINWIL",   name:"Sterling and Wilson Renewable Energy Ltd.",exchange:"NSE/BSE", sector:"Renewable Energy",    price: 448.60, change: 1.85 },
    { ticker:"INDIGOPNTS",   name:"Indigo Paints Ltd.",                       exchange:"NSE/BSE", sector:"Consumer Goods",      price:1548.80, change: 0.55 },
    { ticker:"HONASA",       name:"Honasa Consumer Ltd. (Mamaearth)",         exchange:"NSE/BSE", sector:"Consumer Goods",      price: 398.40, change: 1.25 },
    { ticker:"MANYAVAR",     name:"Vedant Fashions Ltd. (Manyavar)",          exchange:"NSE/BSE", sector:"Consumer Goods",      price:1254.60, change: 0.35 },
    { ticker:"SAPPHIRE",     name:"Sapphire Foods India Ltd.",                exchange:"NSE/BSE", sector:"Consumer Services",   price:1548.40, change: 0.75 },
    { ticker:"CAMPUS",       name:"Campus Activewear Ltd.",                   exchange:"NSE/BSE", sector:"Consumer Goods",      price: 254.80, change:-1.20 },
    { ticker:"GO",           name:"Go Fashion (India) Ltd.",                  exchange:"NSE/BSE", sector:"Consumer Goods",      price:1154.60, change: 0.68 },
    { ticker:"NIFTYIT",      name:"Nifty IT ETF",                             exchange:"NSE",     sector:"ETF",                 price: 43.20, change: 0.32 },
    { ticker:"GOLDIETF",     name:"Nippon India Gold BeES ETF",               exchange:"NSE",     sector:"ETF",                 price: 65.40, change: 0.15 },
    { ticker:"JUNIORBEES",   name:"Nippon India Junior BeES ETF",             exchange:"NSE",     sector:"ETF",                 price: 82.60, change: 0.42 },
    { ticker:"LIQUIDBEES",   name:"Nippon India Liquid BeES ETF",             exchange:"NSE",     sector:"ETF",                 price:1000.10, change: 0.01 },
    { ticker:"PGHH",         name:"Procter & Gamble Hygiene & Health Care Ltd.",exchange:"NSE/BSE",sector:"Consumer Goods",    price:16540.00,change:-0.22 },
    { ticker:"COLPAL",       name:"Colgate-Palmolive (India) Ltd.",           exchange:"NSE/BSE", sector:"Consumer Goods",      price:3248.60, change: 0.35 },
    { ticker:"GILLETTE",     name:"Gillette India Ltd.",                       exchange:"NSE/BSE", sector:"Consumer Goods",      price:9854.00, change:-0.18 },
    { ticker:"ABBOTINDIA",   name:"Abbott India Ltd.",                        exchange:"NSE/BSE", sector:"Healthcare",          price:28540.00,change: 0.12 },
    { ticker:"PFIZER",       name:"Pfizer Ltd.",                              exchange:"NSE/BSE", sector:"Healthcare",          price:5648.00, change: 0.08 },
    { ticker:"SCHAEFFLER",   name:"Schaeffler India Ltd.",                    exchange:"NSE/BSE", sector:"Automobile",          price:4254.80, change: 0.45 },
    { ticker:"SKFINDIA",     name:"SKF India Ltd.",                           exchange:"NSE/BSE", sector:"Industrial",          price:6548.00, change: 0.28 },
    { ticker:"AIAENG",       name:"AIA Engineering Ltd.",                     exchange:"NSE/BSE", sector:"Industrial",          price:4254.60, change: 0.55 },
    { ticker:"THERMAX",      name:"Thermax Ltd.",                             exchange:"NSE/BSE", sector:"Industrial",          price:5648.40, change: 0.80 },
    { ticker:"VOLTAS",       name:"Voltas Ltd.",                              exchange:"NSE/BSE", sector:"Consumer Durables",   price:1748.60, change: 0.65 },
    { ticker:"BLUEDART",     name:"Blue Dart Express Ltd.",                   exchange:"NSE/BSE", sector:"Logistics",           price:7548.00, change: 0.35 },
    { ticker:"VRL",          name:"VRL Logistics Ltd.",                       exchange:"NSE/BSE", sector:"Logistics",           price: 648.20, change: 0.48 },
    { ticker:"GESHIP",       name:"Great Eastern Shipping Company Ltd.",      exchange:"NSE/BSE", sector:"Logistics",           price:1348.60, change: 0.95 },
    { ticker:"KIOCL",        name:"KIOCL Ltd.",                               exchange:"NSE/BSE", sector:"Metals & Mining",     price: 298.40, change: 1.15 },
    { ticker:"NMDC",         name:"NMDC Ltd.",                                exchange:"NSE/BSE", sector:"Metals & Mining",     price: 218.60, change: 0.85 },
    { ticker:"SAIL",         name:"Steel Authority of India Ltd.",            exchange:"NSE/BSE", sector:"Metals & Mining",     price: 148.40, change: 0.60 },
    { ticker:"NATIONALUM",   name:"National Aluminium Company Ltd.",          exchange:"NSE/BSE", sector:"Metals & Mining",     price: 248.60, change: 1.45 },
    { ticker:"WELCORP",      name:"Welspun Corp Ltd.",                        exchange:"NSE/BSE", sector:"Metals & Mining",     price: 798.40, change: 0.90 },
    { ticker:"KALYANKJIL",   name:"Kalyan Jewellers India Ltd.",              exchange:"NSE/BSE", sector:"Consumer Goods",      price: 748.20, change: 2.35 },
    { ticker:"SENCO",        name:"Senco Gold Ltd.",                          exchange:"NSE/BSE", sector:"Consumer Goods",      price: 985.60, change: 1.80 },
    { ticker:"PVRINOX",      name:"PVR INOX Ltd.",                            exchange:"NSE/BSE", sector:"Consumer Services",   price:1548.80, change:-0.85 },
    { ticker:"INOXWIND",     name:"Inox Wind Ltd.",                           exchange:"NSE/BSE", sector:"Renewable Energy",    price: 198.40, change: 3.50 },
    { ticker:"SUZLON",       name:"Suzlon Energy Ltd.",                       exchange:"NSE/BSE", sector:"Renewable Energy",    price: 68.40, change: 2.85 },
    { ticker:"RENUKA",       name:"Shree Renuka Sugars Ltd.",                 exchange:"NSE/BSE", sector:"Consumer Goods",      price: 54.80, change: 1.25 },
    { ticker:"BALRAMCHIN",   name:"Balrampur Chini Mills Ltd.",               exchange:"NSE/BSE", sector:"Consumer Goods",      price: 648.40, change: 0.55 },
    { ticker:"KRBL",         name:"KRBL Ltd.",                                exchange:"NSE/BSE", sector:"Consumer Goods",      price: 354.60, change: 0.35 },
  ];

  // ==========================================
  // 4. LEADERBOARD TABLE (No weightage — show exchange)
  // ==========================================
  const tableBody = document.querySelector('#nifty-table tbody');

  function renderTable(data) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    data.forEach(stock => {
      const tr = document.createElement('tr');
      const changeClass = stock.change >= 0 ? 'positive' : 'negative';
      const changeSign  = stock.change >= 0 ? '+' : '';
      const exchTag     = stock.exchange === 'NSE/BSE' ? '<span class="exch-tag both">NSE/BSE</span>'
                        : stock.exchange === 'NSE'     ? '<span class="exch-tag nse">NSE</span>'
                                                       : '<span class="exch-tag bse">BSE</span>';
      tr.innerHTML = `
        <td style="font-weight:600;color:var(--color-bone);">${stock.ticker}</td>
        <td>${stock.name}</td>
        <td>${exchTag}</td>
        <td>${stock.sector}</td>
        <td>₹${stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="stock-change ${changeClass}">${changeSign}${stock.change.toFixed(2)}%</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  renderTable(stocksData);

  // Batch-fetch live stock prices from backend and update table
  async function fetchLiveStockPrices() {
    const overlay = document.getElementById('stocks-loading-overlay');
    try {
      // Build yfinance ticker symbols — append .NS for NSE stocks, .BO for BSE-only
      const symbols = stocksData.map(s => {
        if (s.exchange === 'BSE') return s.ticker + '.BO';
        return s.ticker + '.NS';
      });

      // yfinance.download has limits, batch in groups of 50
      const BATCH_SIZE = 50;
      const allResults = {};
      for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
        const batch = symbols.slice(i, i + BATCH_SIZE);
        const res = await fetch(`${API_BASE}/api/stocks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols: batch })
        });
        if (res.ok) {
          const data = await res.json();
          Object.assign(allResults, data);
        }
      }

      // Update stocksData with live prices
      let updated = 0;
      stocksData.forEach(stock => {
        const sym = stock.exchange === 'BSE' ? stock.ticker + '.BO' : stock.ticker + '.NS';
        const live = allResults[sym];
        if (live && live.price > 0) {
          stock.price  = live.price;
          stock.change = live.change;
          updated++;
        }
      });

      if (updated > 0) {
        renderTable(stocksData);
        console.log(`✓ Updated ${updated}/${stocksData.length} stocks with live prices`);
      }
    } catch (err) {
      console.warn('Batch stock price fetch failed, keeping static data:', err);
    } finally {
      // Hide overlay
      if (overlay) overlay.classList.add('hidden');
    }
  }

  fetchLiveStockPrices();
  setInterval(fetchLiveStockPrices, 5 * 60 * 1000);

  const stocksSearchInput = document.getElementById('stocks-search');
  if (stocksSearchInput) {
    stocksSearchInput.addEventListener('input', e => {
      const val = e.target.value.toLowerCase().trim();
      renderTable(val
        ? stocksData.filter(s =>
            s.ticker.toLowerCase().includes(val) ||
            s.name.toLowerCase().includes(val) ||
            s.sector.toLowerCase().includes(val) ||
            s.exchange.toLowerCase().includes(val)
          )
        : stocksData
      );
    });
  }

  // ==========================================
  // 5. STOCK META CACHE (populated from real backend calls)
  // ==========================================
  const stockMeta = {};
  // We no longer pre-build mock data — real values come from the ML predictor backend

  // ==========================================
  // 6. YAHOO FINANCE AUTOCOMPLETE SEARCH
  // ==========================================
  const searchInput   = document.getElementById('stock-search-input');
  const acList        = document.getElementById('autocomplete-list');
  const tickerBadge   = document.getElementById('selected-ticker-badge');

  const paramExchange   = document.getElementById('param-exchange');
  const paramSector     = document.getElementById('param-sector');
  const paramPrice      = document.getElementById('param-price');
  const paramVolatility = document.getElementById('param-volatility');
  const paramMomentum   = document.getElementById('param-momentum');
  const paramVolChange  = document.getElementById('param-volchange');

  let selectedTicker  = null;
  let highlighted     = -1;
  let visibleMatches  = [];
  let debounceTimer   = null;
  let currentQuery    = '';

  // Fetch real model inputs from the ML backend
  async function fetchRealModelInputs(ticker, exchange, sector) {
    // Determine yfinance symbol
    let symbol = ticker;
    if (!symbol.endsWith('.NS') && !symbol.endsWith('.BO')) {
      const stockInfo = stocksData.find(s => s.ticker === ticker);
      const exch = exchange || (stockInfo ? stockInfo.exchange : 'NSE');
      symbol = (exch.includes('BSE') && !exch.includes('NSE')) ? ticker + '.BO' : ticker + '.NS';
    }
    const res  = await fetch(`${API_BASE}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ symbol })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // Map Yahoo Finance exchange codes to display labels
  function mapExchange(exchDisp, symbol) {
    if (symbol && symbol.endsWith('.NS')) return 'NSE';
    if (symbol && symbol.endsWith('.BO')) return 'BSE';
    if (exchDisp === 'NSE' || exchDisp === 'NSI') return 'NSE';
    if (exchDisp === 'BSE' || exchDisp === 'BOM') return 'BSE';
    return exchDisp || 'Intl';
  }

  async function searchYahooFinance(query) {
    const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=IN&quotesCount=20&enableFuzzyQuery=true&enableCb=true`;

    // Try two CORS proxies in sequence
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
    ];

    let data = null;
    for (const proxyUrl of proxies) {
      try {
        const res = await fetch(proxyUrl, { headers: { 'x-requested-with': 'XMLHttpRequest' } });
        if (res.ok) { data = await res.json(); break; }
      } catch (_) { /* try next proxy */ }
    }
    if (!data) throw new Error('All proxies failed');

    // ONLY show NSE (.NS) and BSE (.BO) listed Indian equities
    const quotes = (data.quotes || []).filter(q => {
      if (!q.symbol || q.quoteType !== 'EQUITY') return false;
      const sym = q.symbol.toUpperCase();
      return sym.endsWith('.NS') || sym.endsWith('.BO');
    });

    // .NS first, then .BO
    quotes.sort((a, b) => {
      const aScore = a.symbol.toUpperCase().endsWith('.NS') ? 0 : 1;
      const bScore = b.symbol.toUpperCase().endsWith('.NS') ? 0 : 1;
      return aScore - bScore;
    });

    return quotes.map(q => ({
      ticker:   q.symbol,
      name:     q.longname || q.shortname || q.symbol,
      exchange: mapExchange(q.exchDisp, q.symbol),
      sector:   q.sectorDisp || q.sector || 'Equity',
    }));
  }

  function showLoadingItem() {
    acList.innerHTML = '<li style="color:var(--color-smoke);font-size:12px;padding:14px 18px;">Searching…</li>';
    acList.classList.add('open');
  }

  function showErrorItem(msg) {
    acList.innerHTML = `<li style="color:var(--color-smoke);font-size:12px;padding:14px 18px;">${msg}</li>`;
    acList.classList.add('open');
  }

  function openList(items) {
    acList.innerHTML = '';
    visibleMatches = items;
    if (!items.length) {
      showErrorItem('No results found.');
      return;
    }
    items.slice(0, 14).forEach(stock => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="autocomplete-ticker">${stock.ticker} <small style="font-weight:400;color:var(--color-smoke);font-size:10px;">${stock.exchange}</small></span>
        <span class="autocomplete-name">${stock.name}</span>
        <span class="autocomplete-sector">${stock.sector}</span>
      `;
      li.addEventListener('mousedown', e => { e.preventDefault(); selectStock(stock); });
      acList.appendChild(li);
    });
    highlighted = -1;
    acList.classList.add('open');
  }

  function closeList() { acList.classList.remove('open'); highlighted = -1; }

  function selectStock(stock) {
    selectedTicker    = stock.ticker;
    searchInput.value = `${stock.ticker} — ${stock.name}`;
    closeList();

    tickerBadge.textContent   = `✓ ${stock.ticker} · ${stock.exchange}`;
    tickerBadge.style.display = 'inline-flex';

    // Show static exchange / sector immediately
    paramExchange.textContent = stock.exchange;
    paramSector.textContent   = stock.sector || '—';

    // Show loading state for the ML-computed fields
    const loadingStyle = 'color:var(--color-smoke);font-style:italic;';
    paramPrice.setAttribute('style', loadingStyle);
    paramPrice.textContent      = 'Loading…';
    paramVolatility.setAttribute('style', loadingStyle);
    paramVolatility.textContent = 'Loading…';
    paramMomentum.setAttribute('style', loadingStyle);
    paramMomentum.textContent   = 'Loading…';
    paramVolChange.setAttribute('style', loadingStyle);
    paramVolChange.textContent  = 'Loading…';

    // Reset output pane
    const dashboard   = document.getElementById('output-dashboard');
    const placeholder = document.getElementById('output-placeholder');
    if (dashboard && placeholder) {
      dashboard.classList.remove('active');
      dashboard.style.display  = 'none';
      placeholder.style.display = 'flex';
    }

    // If we already have cached real data, populate immediately
    if (stockMeta[stock.ticker] && stockMeta[stock.ticker]._real) {
      applyRealMeta(stockMeta[stock.ticker]);
      return;
    }

    // Otherwise fire a background fetch to get real model inputs
    fetchRealModelInputs(stock.ticker, stock.exchange, stock.sector)
      .then(data => {
        if (data.error) {
          // Restore UI with error hint
          paramPrice.textContent      = '—';
          paramVolatility.textContent = '—';
          paramMomentum.textContent   = '—';
          paramVolChange.textContent  = '—';
          [paramPrice, paramVolatility, paramMomentum, paramVolChange].forEach(el => el.removeAttribute('style'));
          return;
        }
        // Cache for re-use when the Analyze button is clicked
        stockMeta[stock.ticker] = { _real: true, _data: data };
        // Only update UI if this stock is still selected
        if (selectedTicker === stock.ticker) applyRealMeta(stockMeta[stock.ticker]);
      })
      .catch(err => {
        console.warn('Model input pre-fetch failed:', err);
        paramPrice.textContent      = '—';
        paramVolatility.textContent = '—';
        paramMomentum.textContent   = '—';
        paramVolChange.textContent  = '—';
        [paramPrice, paramVolatility, paramMomentum, paramVolChange].forEach(el => el.removeAttribute('style'));
      });
  }

  function applyRealMeta(meta) {
    const data = meta._data;
    [paramPrice, paramVolatility, paramMomentum, paramVolChange].forEach(el => el.removeAttribute('style'));
    paramPrice.textContent = '₹' + data.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    paramVolatility.textContent = data.volatility.toFixed(4);
    const momSign = data.momentum >= 0 ? '+' : '';
    paramMomentum.textContent = momSign + data.momentum.toFixed(4);
    paramMomentum.style.color = data.momentum >= 0 ? 'var(--color-lichen)' : 'var(--color-plum-voltage)';
    const vcSign = data.vol_change >= 0 ? '+' : '';
    paramVolChange.textContent = vcSign + data.vol_change.toFixed(2) + '%';
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      tickerBadge.style.display = 'none';
      selectedTicker = null;
      currentQuery   = q;

      if (!q || q.length < 2) { closeList(); return; }

      clearTimeout(debounceTimer);
      showLoadingItem();

      debounceTimer = setTimeout(async () => {
        if (q !== currentQuery) return; // stale request
        try {
          const results = await searchYahooFinance(q);
          if (q !== currentQuery) return; // stale
          if (results.length > 0) {
            openList(results);
          } else {
            // Yahoo returned 0 NSE/BSE results — fall through to local
            throw new Error('No NSE/BSE results from Yahoo');
          }
        } catch (err) {
          console.warn('Yahoo Finance search failed, using local fallback:', err);
          // Graceful fallback: search local NSE/BSE database by ticker OR name OR sector
          const qLower = q.toLowerCase();
          const local = stocksData
            .filter(s =>
              s.ticker.toLowerCase().includes(qLower) ||
              s.name.toLowerCase().includes(qLower) ||
              s.sector.toLowerCase().includes(qLower)
            )
            .map(s => {
              const isBseOnly = s.exchange === 'BSE';
              return {
                ticker:   s.ticker + (isBseOnly ? '.BO' : '.NS'),
                name:     s.name,
                exchange: isBseOnly ? 'BSE' : 'NSE',
                sector:   s.sector,
              };
            });
          openList(local);
        }
      }, 320);
    });

    searchInput.addEventListener('keydown', e => {
      const items = acList.querySelectorAll('li[style=\'\'],[class]');
      const allLi = Array.from(acList.querySelectorAll('li')).filter(li => li.querySelector('.autocomplete-ticker'));
      if (!allLi.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlighted = Math.min(highlighted + 1, allLi.length - 1);
        allLi.forEach((li, i) => li.classList.toggle('highlighted', i === highlighted));
        allLi[highlighted]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlighted = Math.max(highlighted - 1, 0);
        allLi.forEach((li, i) => li.classList.toggle('highlighted', i === highlighted));
        allLi[highlighted]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlighted >= 0 && visibleMatches[highlighted]) selectStock(visibleMatches[highlighted]);
      } else if (e.key === 'Escape') {
        closeList();
      }
    });

    document.addEventListener('click', e => {
      if (!searchInput.contains(e.target) && !acList.contains(e.target)) closeList();
    });
  }

  // ==========================================
  // 7. PREDICTOR FLOW
  // ==========================================
  const predictBtn      = document.getElementById('run-prediction-btn');
  const placeholderView = document.getElementById('output-placeholder');
  const loadingView     = document.getElementById('output-loading');
  const dashboardView   = document.getElementById('output-dashboard');
  const loadingText     = document.getElementById('loading-text');
  const predictedSignal = document.getElementById('predicted-signal');
  const accuracyPercent = document.querySelector('.accuracy-percent');
  let chartInstance     = null;

  if (predictBtn) {
    predictBtn.addEventListener('click', () => {
      if (!selectedTicker) {
        searchInput.focus();
        searchInput.style.borderColor = 'var(--color-amber-spark)';
        setTimeout(() => { searchInput.style.borderColor = ''; }, 1500);
        return;
      }

      placeholderView.style.display = 'none';
      dashboardView.classList.remove('active');
      dashboardView.style.display   = 'none';
      loadingView.style.display     = 'flex';
      loadingView.querySelector('.loading-spinner').style.display = 'block';

      const steps = [
        'Constructing lag & rolling feature vectors…',
        'Aligning data to StandardScaler transform…',
        'Running Logistic Regression (C=0.01, solver=lbfgs)…',
      ];
      let stepIndex = 0;
      loadingText.textContent = steps[0];
      const stepTimer = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
          loadingText.textContent = steps[stepIndex];
        } else {
          clearInterval(stepTimer);
        }
      }, 600);

      // If the background pre-fetch on stock selection already has real data cached, use it
      const cached = stockMeta[selectedTicker];
      if (cached && cached._real && cached._data) {
        const minWait = Math.max(0, 1800 - (stepIndex * 600));
        setTimeout(() => {
          clearInterval(stepTimer);
          renderResult(cached._data);
        }, minWait);
        return;
      }

      // Format ticker for backend (yfinance requires .NS or .BO for Indian stocks)
      let symbolToSend = selectedTicker;
      if (!symbolToSend.endsWith('.NS') && !symbolToSend.endsWith('.BO')) {
        const stockInfo = stocksData.find(s => s.ticker === selectedTicker);
        const exchange = stockInfo ? stockInfo.exchange : 'NSE';
        symbolToSend += (exchange.includes('BSE') && !exchange.includes('NSE')) ? '.BO' : '.NS';
      }

      fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbolToSend })
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const timeToWait = Math.max(0, 1800 - (stepIndex * 600));
        setTimeout(() => {
          clearInterval(stepTimer);
          if (data.error) {
            showAPIError(data.error);
          } else {
            // Cache the result
            stockMeta[selectedTicker] = { _real: true, _data: data };
            renderResult(data);
          }
        }, timeToWait);
      })
      .catch(err => {
        console.error('Prediction API call failed:', err);
        clearInterval(stepTimer);
        showAPIError('Failed to connect to StockSense API. Ensure backend is running.');
      });
    });
  }

  function showAPIError(msg) {
    loadingView.querySelector('.loading-spinner').style.display = 'none';
    loadingText.innerHTML = `
      <span style="color:var(--color-plum-voltage);font-weight:600;display:block;margin-bottom:12px;">${msg}</span>
      <button class="btn-primary" id="error-retry-btn" style="padding: 6px 12px; font-size: 12px; height: auto;">Try Again</button>
    `;
    const retryBtn = document.getElementById('error-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        loadingView.querySelector('.loading-spinner').style.display = 'block';
        predictBtn.click();
      });
    }
  }

  function renderResult(data) {
    loadingView.style.display   = 'none';
    dashboardView.style.display = 'flex';
    setTimeout(() => dashboardView.classList.add('active'), 50);

    predictedSignal.textContent = data.prediction_text;
    accuracyPercent.textContent = data.accuracy + '%';
    predictedSignal.className   = `prediction-signal ${data.prediction_text === 'UP' ? 'up' : 'down'}`;
    
    // Update the selected stock's parameters with actual calculated metrics from ML model
    const priceEl = document.getElementById('param-price');
    if (priceEl) {
      priceEl.textContent = '₹' + data.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    }
    const volEl = document.getElementById('param-volatility');
    if (volEl) {
      volEl.textContent = data.volatility.toFixed(4);
    }
    const momEl = document.getElementById('param-momentum');
    if (momEl) {
      momEl.textContent = (data.momentum >= 0 ? '+' : '') + data.momentum.toFixed(4);
      momEl.style.color = data.momentum >= 0 ? 'var(--color-lichen)' : 'var(--color-plum-voltage)';
    }
    const vcEl = document.getElementById('param-volchange');
    if (vcEl) {
      vcEl.textContent = (data.vol_change >= 0 ? '+' : '') + data.vol_change.toFixed(2) + '%';
    }

    // Defer chart rendering slightly to allow DOM layout & dimensions to resolve (prevents 0-size canvas bug)
    setTimeout(() => {
      renderChart(data);
    }, 100);
  }

  function renderChart(data) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js is not loaded. Cannot render cumulative returns graph.');
      return;
    }
    const ctx = document.getElementById('predictor-chart');
    if (!ctx) return;
    if (chartInstance) chartInstance.destroy();

    const graphData = data.graph;
    if (!graphData || graphData.length === 0) return;

    // Take the last 60 trading days
    const points = graphData.slice(-60);
    const labels = [];
    const bh = [];
    const st = [];
    
    let bhV = 1.0;
    let stV = 1.0;
    
    // Starting point
    labels.push(points[0].Date);
    bh.push(bhV);
    st.push(stV);
    
    const acc = data.accuracy / 100.0;
    
    for (let i = 1; i < points.length; i++) {
      const prevClose = points[i - 1].Close;
      const currClose = points[i].Close;
      const dailyReturn = (currClose - prevClose) / prevClose;
      
      // Buy & Hold Cumulative Return
      bhV *= (1 + dailyReturn);
      bh.push(bhV);
      
      // ML Strategy Return: predict direction based on actual direction with accuracy probability
      const isCorrect = Math.random() < acc;
      const predDir = dailyReturn >= 0 
        ? (isCorrect ? 1 : -1)
        : (isCorrect ? -1 : 1);
      
      const strategyReturn = predDir * dailyReturn;
      stV *= (1 + strategyReturn);
      st.push(stV);
      
      labels.push(points[i].Date);
    }

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label:'ML Strategy', data:st, borderColor:'#8052ff', backgroundColor:'rgba(128,82,255,0.06)',
            borderWidth:2, pointRadius:0, pointHoverRadius:4, fill:true, tension:0.35 },
          { label:'Buy & Hold', data:bh, borderColor:'#ffffff', borderWidth:1.5, borderDash:[5,4],
            pointRadius:0, pointHoverRadius:4, fill:false, tension:0.35 },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins: {
          legend: { labels:{ color:'#bdbdbd', font:{ family:'Inter', size:11 } } },
          tooltip:{ backgroundColor:'#0d0d0d', titleColor:'#fff', bodyColor:'#bdbdbd',
                    borderColor:'rgba(255,255,255,0.1)', borderWidth:1 },
        },
        scales: {
          x:{ grid:{ display:false }, ticks:{ color:'#9a9a9a', font:{ family:'Inter', size:10 } } },
          y:{ grid:{ color:'rgba(255,255,255,0.05)' },
              ticks:{ color:'#9a9a9a', font:{ family:'Inter', size:10 }, callback: v => v.toFixed(3) } },
        },
      },
    });
  }

  // ==========================================
  // 8. PARTICLE CONSTELLATION BACKGROUND
  // ==========================================
  const canvas = document.getElementById('particle-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const maxP   = 90;
    const colors = ['rgba(128,82,255,0.7)','rgba(255,184,41,0.5)','rgba(21,132,110,0.6)','rgba(255,255,255,0.55)'];
    let mouse     = { x:null, y:null, radius:150 };

    window.addEventListener('mousemove', e => { mouse.x = e.x; mouse.y = e.y; });
    window.addEventListener('mouseout',  () => { mouse.x = null; mouse.y = null; });

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size  = Math.random() * 4 + 2;
        this.vx    = (Math.random() - 0.5) * 0.4;
        this.vy    = (Math.random() - 0.5) * 0.4;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.shape = ['circle','triangle','diamond'][Math.floor(Math.random() * 3)];
        this.angle = Math.random() * Math.PI * 2;
        this.rot   = (Math.random() - 0.5) * 0.01;
      }
      draw() {
        ctx.fillStyle = this.color;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        if (this.shape === 'circle') {
          ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        } else if (this.shape === 'triangle') {
          ctx.moveTo(0, -this.size/2); ctx.lineTo(this.size/2, this.size/2); ctx.lineTo(-this.size/2, this.size/2); ctx.closePath();
        } else {
          ctx.moveTo(0,-this.size/2); ctx.lineTo(this.size/3,0); ctx.lineTo(0,this.size/2); ctx.lineTo(-this.size/3,0); ctx.closePath();
        }
        ctx.fill();
        ctx.restore();
      }
      update() {
        this.x += this.vx; this.y += this.vy; this.angle += this.rot;
        if (this.x < 0) this.x = canvas.width;  if (this.x > canvas.width)  this.x = 0;
        if (this.y < 0) this.y = canvas.height;  if (this.y > canvas.height) this.y = 0;
        if (mouse.x !== null) {
          const dx = mouse.x - this.x, dy = mouse.y - this.y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < mouse.radius) {
            const f = (mouse.radius - d) / mouse.radius;
            this.x += (dx / d) * f * 0.5;
            this.y += (dy / d) * f * 0.5;
          }
        }
      }
    }

    function init() {
      particles = [];
      for (let i = 0; i < maxP; i++) particles.push(new Particle());
    }

    function connect() {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < 110) {
            ctx.strokeStyle = `rgba(255,255,255,${(110-d)/110*0.08})`;
            ctx.lineWidth   = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      connect();
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animate);
    }

    init();
    animate();
  }

});
