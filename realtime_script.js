class CryptoWebSocketClient {
    constructor() {
        this.websocketUrl = 'wss://167.172.151.11.nip.io';
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.isConnected = false;
        
        this.init();
    }
    
    init() {
        this.updateStatus('Connecting...', 'connecting');
        this.connect();
    }
    
    connect() {
        try {
            this.socket = new WebSocket(this.websocketUrl);
            
            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateStatus('LIVE', 'connected');
                this.updateLastUpdated();
            };
            
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Received data:', data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.socket.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.handleDisconnection();
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnected = false;
                this.updateStatus('Connection failed. Please refresh the page.', 'error');
            };
            
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            this.updateStatus('Failed to connect. Retrying...', 'error');
            this.scheduleReconnect();
        }
    }
    
    handleMessage(data) {
        if (data.btc) {
            this.updateCryptoData('btc', data.btc);
        }
        if (data.eth) {
            this.updateCryptoData('eth', data.eth);
        }
        this.updateLastUpdated();
    }
    
    updateCryptoData(crypto, data) {
        const cryptoSection = document.getElementById(`${crypto}-section`);
        if (!cryptoSection) return;
        
        // Update price
        const priceElement = cryptoSection.querySelector('.crypto-price');
        const changeElement = cryptoSection.querySelector('.crypto-change');
        
        if (priceElement && data.price) {
            priceElement.textContent = `$${data.price.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
        
        if (changeElement && data.change_24h !== undefined) {
            const change = data.change_24h;
            changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            changeElement.className = `crypto-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Update traffic light analysis
        if (data.traffic_light) {
            this.updateTrafficLight(crypto, data.traffic_light);
        }
        
        // Update technical indicators
        if (data.technical_data) {
            this.updateTechnicalData(crypto, data.technical_data);
        }
        
        // Update news sentiment
        if (data.news_sentiment) {
            this.updateNewsSentiment(crypto, data.news_sentiment);
        }
        
        // Update news articles
        if (data.news_articles) {
            this.updateNewsArticles(crypto, data.news_articles);
        }
    }
    
    updateTrafficLight(crypto, trafficLight) {
        const statusElement = document.querySelector(`#${crypto}-section .traffic-status`);
        const explanationElement = document.querySelector(`#${crypto}-section .traffic-explanation`);
        const signalsElement = document.querySelector(`#${crypto}-section .market-signals`);
        
        if (statusElement) {
            statusElement.textContent = trafficLight.status.toUpperCase();
            statusElement.className = `traffic-status ${trafficLight.status.toLowerCase()}`;
        }
        
        if (explanationElement) {
            explanationElement.textContent = trafficLight.explanation || 'Analyzing market conditions...';
        }
        
        if (signalsElement && trafficLight.signals) {
            signalsElement.innerHTML = trafficLight.signals.map(signal => 
                `<li>▶ ${signal}</li>`
            ).join('');
        }
    }
    
    updateTechnicalData(crypto, technicalData) {
        const section = document.querySelector(`#${crypto}-section`);
        if (!section) return;
        
        // Update SMAs
        const sma20Element = section.querySelector('.sma-20-value');
        const sma50Element = section.querySelector('.sma-50-value');
        const sma200Element = section.querySelector('.sma-200-value');
        const rsiElement = section.querySelector('.rsi-value');
        
        if (sma20Element && technicalData.sma_20) {
            sma20Element.textContent = `$${technicalData.sma_20.toLocaleString()}`;
        }
        
        if (sma50Element && technicalData.sma_50) {
            sma50Element.textContent = `$${technicalData.sma_50.toLocaleString()}`;
        }
        
        if (sma200Element && technicalData.sma_200) {
            sma200Element.textContent = `$${technicalData.sma_200.toLocaleString()}`;
        }
        
        if (rsiElement && technicalData.rsi) {
            rsiElement.textContent = technicalData.rsi.toFixed(1);
            
            // Color code RSI
            const rsi = technicalData.rsi;
            if (rsi > 70) {
                rsiElement.style.color = '#ff6b6b'; // Red for overbought
            } else if (rsi < 30) {
                rsiElement.style.color = '#51cf66'; // Green for oversold
            } else {
                rsiElement.style.color = '#ffd43b'; // Yellow for neutral
            }
        }
        
        // Update MACD
        if (technicalData.macd) {
            const macdLineElement = section.querySelector('.macd-line');
            const signalLineElement = section.querySelector('.signal-line');
            const histogramElement = section.querySelector('.histogram-value');
            
            if (macdLineElement) {
                macdLineElement.textContent = technicalData.macd.macd_line;
            }
            
            if (signalLineElement) {
                signalLineElement.textContent = technicalData.macd.signal_line;
            }
            
            if (histogramElement) {
                const histogram = technicalData.macd.histogram;
                histogramElement.textContent = histogram;
                histogramElement.style.color = histogram > 0 ? '#51cf66' : '#ff6b6b';
            }
        }
    }
    
    updateNewsSentiment(crypto, sentiment) {
        const section = document.querySelector(`#${crypto}-section`);
        if (!section) return;
        
        const sentimentStatusElement = section.querySelector('.news-sentiment-status');
        const sentimentScoreElement = section.querySelector('.sentiment-score');
        const sentimentAnalysisElement = section.querySelector('.sentiment-analysis');
        
        if (sentimentStatusElement) {
            sentimentStatusElement.textContent = sentiment.overall_sentiment;
            sentimentStatusElement.className = `news-sentiment-status ${sentiment.overall_sentiment.toLowerCase()}`;
        }
        
        if (sentimentScoreElement) {
            sentimentScoreElement.textContent = sentiment.sentiment_score;
        }
        
        if (sentimentAnalysisElement) {
            const positivePercent = sentiment.positive_percentage || 0;
            const negativePercent = sentiment.negative_percentage || 0;
            sentimentAnalysisElement.textContent = 
                `Market sentiment analysis: ${positivePercent}% positive, ${negativePercent}% negative news coverage`;
        }
    }
    
    updateNewsArticles(crypto, articles) {
        const section = document.querySelector(`#${crypto}-section`);
        if (!section) return;
        
        const newsContainer = section.querySelector('.news-articles-container');
        if (!newsContainer) return;
        
        if (!articles || articles.length === 0) {
            newsContainer.innerHTML = `
                <div class="news-article">
                    <div class="news-source">Crypto Daily Pulse</div>
                    <div class="news-title">No recent news available</div>
                    <div class="news-description">Please check back later for the latest updates.</div>
                </div>
            `;
            return;
        }
        
        newsContainer.innerHTML = articles.slice(0, 3).map(article => `
            <div class="news-article">
                <div class="news-source">${article.source || 'Crypto Daily Pulse'}</div>
                <div class="news-title">${article.title}</div>
                <div class="news-description">${article.description}</div>
                <div class="news-time">${this.formatTime(article.published_at)}</div>
            </div>
        `).join('');
    }
    
    formatTime(timestamp) {
        if (!timestamp) return 'Recently';
        
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffDays > 0) {
                return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            } else if (diffHours > 0) {
                return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            } else {
                return 'Recently';
            }
        } catch (error) {
            return 'Recently';
        }
    }
    
    handleDisconnection() {
        this.updateStatus('Connection lost. Attempting to reconnect...', 'disconnected');
        this.scheduleReconnect();
    }
    
    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
        } else {
            this.updateStatus('OFFLINE', 'offline');
            console.log('Max reconnection attempts reached');
        }
    }
    
    updateStatus(status, className) {
        const statusElement = document.getElementById('connection-status');
        const statusTextElement = document.getElementById('status-text');
        
        if (statusElement) {
            statusElement.className = `connection-status ${className}`;
        }
        
        if (statusTextElement) {
            statusTextElement.textContent = status;
        }
    }
    
    updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('last-updated');
        if (lastUpdatedElement) {
            const now = new Date();
            const timeString = now.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            });
            lastUpdatedElement.textContent = `Last Updated ${timeString}`;
        }
    }
}

// Initialize the WebSocket client when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Crypto WebSocket Client...');
    new CryptoWebSocketClient();
});

// Add some basic error handling for the entire page
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
