const express = require('express');
const yahooFinance = require('yahoo-finance2').default;

const app = express();
const port = process.env.PORT || 8000;

app.use(cors())

const stocks = [
    { ticker: 'BHARTIARTL.NS', label: 'Bharti Airtel Limited', allocation_percentage: 4.4 },
    { ticker: 'BIRET.BO', label: 'Brookfield India Real Estate Trust', allocation_percentage: 7.87 },
    { ticker: 'BRITANNIA.NS', label: 'Britannia Industries Limited', allocation_percentage: 4.13 },
    { ticker: 'COLPAL.BO', label: 'Colgate-Palmolive (India) Limited', allocation_percentage: 3.26 },
    { ticker: 'DABUR.NS', label: 'Dabur India Limited', allocation_percentage: 3.6 },
    { ticker: 'DRREDDY.NS', label: `Dr. Reddy's Laboratories Limited`, allocation_percentage: 3.12 },
    { ticker: 'EMBASSY-RR.NS', label: 'Embassy Office Parks REIT', allocation_percentage: 5.25 },
    { ticker: 'HDFCBANK.NS', label: 'HDFC Bank Limited', allocation_percentage: 4.08 },
    { ticker: 'HINDUNILVR.NS', label: 'HINDUSTAN UNILEVER Limited', allocation_percentage: 4.4 },
    { ticker: 'ICICIBANK.NS', label: 'ICICI Bank Limited', allocation_percentage: 3.78 },
    { ticker: 'ICRA.NS', label: 'ICRA Limited', allocation_percentage: 2.83 },
    { ticker: 'ITC.NS', label: 'ITC Limited', allocation_percentage: 3.33 },
    { ticker: 'KOTAKBANK.NS', label: 'Kotak Mahindra Bank Limited', allocation_percentage: 4.81 },
    { ticker: 'MARICO.NS', label: 'Marico Limited', allocation_percentage: 3.23 },
    { ticker: 'MINDSPACE-RR.NS', label: 'MINDSPACE BUSINESS P REIT', allocation_percentage: 10.31 },
    { ticker: 'NESTLEIND.NS', label: 'Nestlé India Limited', allocation_percentage: 4.63 },
    { ticker: 'PFIZER.NS', label: 'Pfizer Limited', allocation_percentage: 3.16 },
    { ticker: 'PGHL.NS', label: 'Procter & Gamble Health Limited', allocation_percentage: 3.36 },
    { ticker: 'RELAXO.NS', label: 'Relaxo Footwears Limited', allocation_percentage: 2.6 },
    { ticker: 'RELIANCE.NS', label: 'Reliance Industries Limited', allocation_percentage: 3.34 },
    { ticker: 'SBILIFE.NS', label: 'SBI Life Insurance Company Limited', allocation_percentage: 3.22 },
    { ticker: 'SUNDRMFAST.NS', label: 'Sundram Fasteners Limited', allocation_percentage: 2.75 },
    { ticker: 'SUNPHARMA.NS', label: 'Sun Pharmaceutical Industries Limited', allocation_percentage: 3.56 },
    { ticker: 'TCS.NS', label: 'Tata Consultancy Services Limited', allocation_percentage: 3.08 },
    { ticker: 'TORNTPHARM.NS', label: 'Torrent Pharmaceuticals Limited', allocation_percentage: 2.97 },
];

async function fetchStockPrice(ticker, label) {
    try {
        console.log(`Fetching price for ${label} (${ticker})...`);
        const quote = await yahooFinance.quote(ticker);
        return quote?.regularMarketPrice ?? 'N/A';
    } catch (error) {
        console.error(`Error fetching ${label} (${ticker}): ${error.message}`);
        return 'N/A';
    }
}

async function fetchAllStockPrices() {
    try {
        const fetchPromises = stocks.map(stock => fetchStockPrice(stock.ticker, stock.label));
        const prices = await Promise.all(fetchPromises);

        return stocks.map((stock, index) => ({
            stock_name: stock.label,
            stock_ticker: stock.ticker,
            last_traded_price: prices[index],
            allocation_percentage: stock.allocation_percentage
        }));
    } catch (error) {
        throw new Error('Failed to fetch stock prices: ' + error.message);
    }
}

// API endpoint
app.get('/api/stocks', async (req, res) => {
    try {
        const query = req.query;
        const investment = query?.investment ? parseFloat(query.investment) : null;
        
        // Input validation
        if (investment !== null && (isNaN(investment) || investment <= 0)) {
            return res.status(400).json({
                success: false,
                error: 'Investment amount must be a positive number'
            });
        }

        const stockData = await fetchAllStockPrices();

        // Calculate allocated quantities if investment is provided
        const enhancedStockData = stockData.map(stock => {
            let allocatedQuantity = null;
            let allocatedAmount = null;

            // Only calculate if investment is provided and price is valid
            if (investment && stock.last_traded_price !== 'N/A' && !isNaN(stock.last_traded_price)) {

                allocatedAmount = +(investment * (stock.allocation_percentage / 100)).toFixed(0);
                allocatedQuantity = Math.ceil(allocatedAmount / stock.last_traded_price);
            }


            console.log({
                stock: stock.stock_name,
                allocation_percentage: stock.allocation_percentage,
                investment: investment,
                last_traded_price: stock.last_traded_price,
                allocatedAmount: allocatedAmount,
                allocatedQuantity: allocatedQuantity
            });

            return {
                ...stock,
                allocated_quantity: allocatedQuantity,
                allocated_amount: allocatedAmount
            };
        });

        res.json({
            success: true,
            data: enhancedStockData,
            investment_amount: investment,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.send('Stock API is running');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});