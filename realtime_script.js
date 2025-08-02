// Crypto Daily Pulse - Real-time Enhanced JavaScript File

class RealTimeCryptoDashboard {
    constructor() {
        this.dataFile = 'analysis.json';
        this.websocketUrl = 'ws://167.172.151.11:8765';
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.isConnected = false;
        this.lastPrices = { btc: 0, eth: 0 };
        this.init();
    }

    async init() {
        try {
            // Load initial analysis data
            await this.loadAnalysisData();
            
            // Connect to real-time WebSocket
            this.connectWebSocket();
            
            // Setup auto-refresh for analysis data (every 5 minutes)
            this.setupAnalysisRefresh();
            
            // Setup connection status indicator
            this.setupConnectionStatus();
            
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.showError('Failed to initialize dashboard. Please refresh the page.');
        }
    }

    setupConnectionStatus() {
        // Create connection status indicator
        const statusDiv = document.createElement('div');
        statusDiv.id = 'connection-status';
        statusDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            z-index: 1000;
            transition: all 0.3s ease;
            font-family: 'Orbitron', monospace;
        `;
        document.body.appendChild(statusDiv);
        this.updateConnectionStatus('connecting');
    }

    updateConnectionStatus(status) {
        const statusDiv = document.getElementById('connection-status');
        if (!statusDiv) return;

        switch (status) {
            case 'connected':
                statusDiv.textContent = '🟢 LIVE';
                statusDiv.style.background = 'rgba(0, 255, 100, 0.2)';
                statusDiv.style.color = '#00ff64';
                statusDiv.style.border = '1px solid rgba(0, 255, 100, 0.3)';
                break;
            case 'connecting':
                statusDiv.textContent = '🟡 CONNECTING';
                statusDiv.style.background = 'rgba(255, 200, 0, 0.2)';
                statusDiv.style.color = '#ffc800';
                statusDiv.style.border = '1px solid rgba(255, 200, 0, 0.3)';
                break;
            case 'disconnected':
                statusDiv.textContent = '🔴 OFFLINE';
                statusDiv.style.background = 'rgba(255, 50, 50, 0.2)';
                statusDiv.style.color = '#ff3232';
                statusDiv.style.border = '1px solid rgba(255, 50, 50, 0.3)';
                break;
        }
    }

    connectWebSocket() {
        try {
            this.updateConnectionStatus('connecting');
            this.websocket = new WebSocket(this.websocketUrl);

            this.websocket.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
                this.updateConnectionStatus('connected');
                
                // Send ping every 30 seconds to keep connection alive
                this.startPingInterval();
            };

            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'price_update') {
                        this.updateRealTimePrices(data.data);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.websocket.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                this.stopPingInterval();
                this.handleReconnect();
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('disconnected');
            };

        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            this.updateConnectionStatus('disconnected');
            this.handleReconnect();
        }
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`);
            
            setTimeout(() => {
                this.connectWebSocket();
            }, this.reconnectDelay);
            
            // Exponential backoff
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
        } else {
            console.error('Max reconnection attempts reached');
            this.showError('Lost connection to real-time data. Please refresh the page.');
        }
    }

    startPingInterval() {
        this.pingInterval = setInterval(() => {
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
    }

    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    updateRealTimePrices(priceData) {
        // Update BTC price
        if (priceData.btc && priceData.btc.price) {
            const btcPrice = priceData.btc.price;
            const btcElement = document.getElementById('btc-price');
            if (btcElement) {
                this.animatePriceChange(btcElement, this.lastPrices.btc, btcPrice);
                btcElement.textContent = this.formatPrice(btcPrice);
                this.lastPrices.btc = btcPrice;
            }
        }

        // Update ETH price
        if (priceData.eth && priceData.eth.price) {
            const ethPrice = priceData.eth.price;
            const ethElement = document.getElementById('eth-price');
            if (ethElement) {
                this.animatePriceChange(ethElement, this.lastPrices.eth, ethPrice);
                ethElement.textContent = this.formatPrice(ethPrice);
                this.lastPrices.eth = ethPrice;
            }
        }

        // Update last updated time
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            const now = new Date();
            const formattedTime = now.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            });
            lastUpdatedElement.textContent = `Last Updated: ${formattedTime} (Live)`;
        }
    }

    animatePriceChange(element, oldPrice, newPrice) {
        if (oldPrice === 0) return; // Skip animation for initial load

        // Remove existing animation classes
        element.classList.remove('price-up', 'price-down', 'price-flash');

        // Add appropriate animation class
        if (newPrice > oldPrice) {
            element.classList.add('price-up');
        } else if (newPrice < oldPrice) {
            element.classList.add('price-down');
        }

        // Add flash effect
        element.classList.add('price-flash');

        // Remove animation classes after animation completes
        setTimeout(() => {
            element.classList.remove('price-up', 'price-down', 'price-flash');
        }, 1000);
    }

    async loadAnalysisData() {
        try {
            const response = await fetch(this.dataFile);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.updateAnalysisData(data);
        } catch (error) {
            console.error('Error loading analysis data:', error);
            // Load sample data if analysis.json doesn't exist
            this.loadSampleAnalysisData();
        }
    }

    loadSampleAnalysisData() {
        const sampleData = {
            last_updated: new Date().toISOString(),
            btc: {
                price: 45250.75,
                technical_analysis: {
                    sma_20: 44800.25,
                    sma_50: 43200.80,
                    rsi: 65.4,
                    summary: "Bitcoin is showing bullish momentum with price above both 20-day and 50-day SMAs. RSI indicates the asset is approaching overbought territory but still has room for growth."
                },
                news_sentiment: {
                    overall_sentiment: "Positive",
                    summary: "Market sentiment remains positive with institutional adoption news and regulatory clarity driving optimism.",
                    headlines: [
                        "Major Bank Announces Bitcoin Treasury Strategy",
                        "Regulatory Framework Provides Market Clarity",
                        "Institutional Adoption Continues to Grow"
                    ]
                }
            },
            eth: {
                price: 2850.40,
                technical_analysis: {
                    sma_20: 2780.15,
                    sma_50: 2650.90,
                    rsi: 58.2,
                    summary: "Ethereum maintains a strong uptrend with price well above key moving averages. RSI suggests healthy momentum without being overextended."
                },
                news_sentiment: {
                    overall_sentiment: "Neutral",
                    summary: "Mixed sentiment as network upgrades show promise while gas fees remain a concern for users.",
                    headlines: [
                        "Ethereum Network Upgrade Shows Promise",
                        "Gas Fees Remain High Despite Improvements",
                        "DeFi Activity Continues to Drive Usage"
                    ]
                }
            }
        };
        this.updateAnalysisData(sampleData);
    }

    updateAnalysisData(data) {
        // Update technical analysis and news sentiment (not prices - those come from WebSocket)
        this.updateCryptoAnalysis('btc', data.btc);
        this.updateCryptoAnalysis('eth', data.eth);
        this.removeLoadingStates();
    }

    updateCryptoAnalysis(crypto, data) {
        // Update technical indicators
        const sma20Element = document.getElementById(`${crypto}-sma20`);
        const sma50Element = document.getElementById(`${crypto}-sma50`);
        const rsiElement = document.getElementById(`${crypto}-rsi`);

        if (sma20Element) sma20Element.textContent = this.formatPrice(data.technical_analysis.sma_20);
        if (sma50Element) sma50Element.textContent = this.formatPrice(data.technical_analysis.sma_50);
        if (rsiElement) {
            rsiElement.textContent = data.technical_analysis.rsi.toFixed(1);
            this.colorCodeRSI(rsiElement, data.technical_analysis.rsi);
        }

        // Update technical summary
        const technicalSummaryElement = document.getElementById(`${crypto}-technical-summary`);
        if (technicalSummaryElement) {
            technicalSummaryElement.textContent = data.technical_analysis.summary;
        }

        // Update sentiment
        this.updateSentiment(crypto, data.news_sentiment);

        // Update news summary
        const newsSummaryElement = document.getElementById(`${crypto}-news-summary`);
        if (newsSummaryElement) {
            newsSummaryElement.textContent = data.news_sentiment.summary;
        }

        // Update headlines
        this.updateHeadlines(crypto, data.news_sentiment.headlines);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    }

    colorCodeRSI(element, rsi) {
        element.classList.remove('sentiment-positive', 'sentiment-negative', 'sentiment-neutral');
        
        if (rsi > 70) {
            element.classList.add('sentiment-negative'); // Overbought
        } else if (rsi < 30) {
            element.classList.add('sentiment-positive'); // Oversold (potential buy)
        } else {
            element.classList.add('sentiment-neutral'); // Normal range
        }
    }

    updateSentiment(crypto, sentimentData) {
        const sentimentElement = document.getElementById(`${crypto}-sentiment`);
        if (!sentimentElement) return;
        
        const sentimentValueElement = sentimentElement.querySelector('.sentiment-value');
        if (!sentimentValueElement) return;
        
        sentimentValueElement.textContent = sentimentData.overall_sentiment;
        
        // Remove existing sentiment classes
        sentimentValueElement.classList.remove('sentiment-positive', 'sentiment-negative', 'sentiment-neutral');
        
        // Add appropriate sentiment class
        const sentiment = sentimentData.overall_sentiment.toLowerCase();
        if (sentiment === 'positive') {
            sentimentValueElement.classList.add('sentiment-positive');
        } else if (sentiment === 'negative') {
            sentimentValueElement.classList.add('sentiment-negative');
        } else {
            sentimentValueElement.classList.add('sentiment-neutral');
        }
    }

    updateHeadlines(crypto, headlines) {
        const headlinesContainer = document.getElementById(`${crypto}-headlines`);
        if (!headlinesContainer) return;
        
        headlinesContainer.innerHTML = '';

        headlines.forEach(headline => {
            const headlineElement = document.createElement('div');
            headlineElement.className = 'headline-item';
            headlineElement.textContent = headline;
            headlinesContainer.appendChild(headlineElement);
        });
    }

    removeLoadingStates() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(element => {
            element.classList.remove('loading');
        });
    }

    setupAnalysisRefresh() {
        // Refresh analysis data every 5 minutes
        setInterval(() => {
            this.loadAnalysisData();
        }, 5 * 60 * 1000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            background: rgba(255, 50, 50, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #ff3232;
            z-index: 1000;
            font-family: 'Orbitron', monospace;
            max-width: 300px;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        // Remove error message after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    // Cleanup method
    destroy() {
        if (this.websocket) {
            this.websocket.close();
        }
        this.stopPingInterval();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the real-time dashboard
    window.cryptoDashboard = new RealTimeCryptoDashboard();

    // Add enhanced hover effects to cards
    const cards = document.querySelectorAll('.analysis-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add click effect to headline items
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('headline-item')) {
            e.target.style.transform = 'scale(0.98)';
            setTimeout(() => {
                e.target.style.transform = 'scale(1)';
            }, 150);
        }
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        if (window.cryptoDashboard) {
            window.cryptoDashboard.destroy();
        }
    });
});

// Add smooth scrolling for any internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

