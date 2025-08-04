class EnhancedCryptoDashboard {
    constructor() {
        this.websocketUrl = 'ws://167.172.151.11:8765';
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.isConnected = false;
        
        this.init();
    }

    init() {
        this.updateConnectionStatus('CONNECTING', 'Connecting to live data...');
        this.connectWebSocket();
    }

    connectWebSocket() {
        try {
            this.websocket = new WebSocket(this.websocketUrl);
            
            this.websocket.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus('LIVE', `Last Updated ${new Date().toLocaleString()}`);
            };

            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'full_update' && data.data) {
                        this.updateDashboard(data.data);
                        this.updateConnectionStatus('LIVE', `Last Updated ${new Date().toLocaleString()}`);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.websocket.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.updateConnectionStatus('OFFLINE', 'Connection lost. Attempting to reconnect...');
                this.handleReconnect();
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('OFFLINE', 'Connection error. Retrying...');
            };

        } catch (error) {
            console.error('Error creating WebSocket:', error);
            this.updateConnectionStatus('OFFLINE', 'Failed to connect. Retrying...');
            this.handleReconnect();
        }
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => {
                this.connectWebSocket();
            }, this.reconnectDelay);
        } else {
            this.updateConnectionStatus('OFFLINE', 'Connection failed. Please refresh the page.');
        }
    }

    updateConnectionStatus(status, message) {
        const statusElement = document.getElementById('connection-status');
        const messageElement = document.getElementById('status-message');
        
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `status ${status.toLowerCase()}`;
        }
        
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    updateDashboard(data) {
        // Update Bitcoin data
        if (data.btc) {
            this.updateCryptoSection('btc', data.btc);
        }
        
        // Update Ethereum data
        if (data.eth) {
            this.updateCryptoSection('eth', data.eth);
        }
        
        // Update News section
        if (data.news) {
            this.updateNewsSection(data.news);
        }
    }

    updateCryptoSection(crypto, cryptoData) {
        const cryptoName = crypto.toUpperCase();
        
        // Update price
        const priceElement = document.getElementById(`${crypto}-price`);
        if (priceElement && cryptoData.price) {
            priceElement.textContent = `$${cryptoData.price.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }

        // Update 24h change
        const changeElement = document.getElementById(`${crypto}-change`);
        if (changeElement && cryptoData.change_24h !== undefined) {
            const change = cryptoData.change_24h;
            const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            changeElement.textContent = changeText;
            changeElement.className = `change ${change >= 0 ? 'positive' : 'negative'}`;
        }

        // Update traffic-light analysis
        if (cryptoData.traffic_light) {
            this.updateTrafficLightAnalysis(crypto, cryptoData.traffic_light);
        }
    }

    updateTrafficLightAnalysis(crypto, trafficLight) {
        // Update status badge
        const statusElement = document.getElementById(`${crypto}-status`);
        if (statusElement) {
            statusElement.textContent = trafficLight.status.toUpperCase();
            statusElement.className = `status-badge ${trafficLight.color}`;
        }

        // Update explanation
        const explanationElement = document.getElementById(`${crypto}-explanation`);
        if (explanationElement) {
            explanationElement.textContent = trafficLight.explanation;
        }

        // Update market signals
        const signalsElement = document.getElementById(`${crypto}-signals`);
        if (signalsElement && trafficLight.signals) {
            signalsElement.innerHTML = trafficLight.signals
                .map(signal => `<li>${signal}</li>`)
                .join('');
        }

        // Update technical data display
        if (trafficLight.technical_data) {
            this.updateTechnicalData(crypto, trafficLight.technical_data);
        }
    }

    updateTechnicalData(crypto, technicalData) {
        // Update SMA values
        if (technicalData.sma_20) {
            const sma20Element = document.getElementById(`${crypto}-sma20`);
            if (sma20Element) {
                sma20Element.textContent = `$${technicalData.sma_20.toLocaleString()}`;
            }
        }

        if (technicalData.sma_50) {
            const sma50Element = document.getElementById(`${crypto}-sma50`);
            if (sma50Element) {
                sma50Element.textContent = `$${technicalData.sma_50.toLocaleString()}`;
            }
        }

        if (technicalData.sma_200) {
            const sma200Element = document.getElementById(`${crypto}-sma200`);
            if (sma200Element) {
                sma200Element.textContent = `$${technicalData.sma_200.toLocaleString()}`;
            }
        }

        // Update RSI
        if (technicalData.rsi) {
            const rsiElement = document.getElementById(`${crypto}-rsi`);
            if (rsiElement) {
                rsiElement.textContent = technicalData.rsi.toFixed(1);
                
                // Add RSI color coding
                const rsiValue = technicalData.rsi;
                let rsiClass = 'neutral';
                if (rsiValue > 70) rsiClass = 'overbought';
                else if (rsiValue < 30) rsiClass = 'oversold';
                
                rsiElement.className = `rsi-value ${rsiClass}`;
            }
        }

        // Update MACD
        if (technicalData.macd) {
            const macdElement = document.getElementById(`${crypto}-macd`);
            if (macdElement) {
                const macd = technicalData.macd;
                macdElement.innerHTML = `
                    <span class=\"macd-line\">MACD: ${macd.macd_line}</span>
                    <span class=\"signal-line\">Signal: ${macd.signal_line}</span>
                    <span class=\"histogram ${macd.histogram >= 0 ? 'positive' : 'negative'}\">
                        Histogram: ${macd.histogram}
                    </span>
                `;
            }
        }
    }

    updateNewsSection(newsData) {
        // Update overall sentiment
        if (newsData.sentiment) {
            this.updateNewsSentiment(newsData.sentiment);
        }

        // Update news articles
        if (newsData.articles) {
            this.updateNewsArticles(newsData.articles);
        }
    }

    updateNewsSentiment(sentiment) {
        // Update overall sentiment badge
        const sentimentElement = document.getElementById('overall-sentiment');
        if (sentimentElement) {
            sentimentElement.textContent = sentiment.overall_sentiment;
            sentimentElement.className = `sentiment-badge ${sentiment.overall_sentiment.toLowerCase()}`;
        }

        // Update sentiment description
        const descriptionElement = document.getElementById('sentiment-description');
        if (descriptionElement) {
            const posPercent = sentiment.positive_percentage || 0;
            const negPercent = sentiment.negative_percentage || 0;
            descriptionElement.textContent = 
                `Market sentiment analysis: ${posPercent}% positive, ${negPercent}% negative news coverage`;
        }

        // Update sentiment score
        const scoreElement = document.getElementById('sentiment-score');
        if (scoreElement) {
            const score = sentiment.sentiment_score || 0;
            scoreElement.textContent = `Sentiment Score: ${score >= 0 ? '+' : ''}${score}`;
            scoreElement.className = `sentiment-score ${score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'}`;
        }
    }

    updateNewsArticles(articles) {
        const newsContainer = document.getElementById('news-articles');
        if (!newsContainer) return;

        if (!articles || articles.length === 0) {
            newsContainer.innerHTML = '<p class=\"no-news\">No recent news available</p>';
            return;
        }

        const newsHTML = articles.map(article => {
            const publishedDate = article.published_at ? 
                new Date(article.published_at).toLocaleDateString() : 'Recent';
            
            return `
                <div class=\"news-item\">
                    <div class=\"news-header\">
                        <h4 class=\"news-title\">${this.escapeHtml(article.title)}</h4>
                        <span class=\"news-source\">${this.escapeHtml(article.source)}</span>
                    </div>
                    <p class=\"news-description\">${this.escapeHtml(article.description)}</p>
                    <div class=\"news-footer\">
                        <span class=\"news-date\">${publishedDate}</span>
                        ${article.url && article.url !== '#' ? 
                            `<a href=\"${article.url}\" target=\"_blank\" class=\"news-link\">Read more</a>` : 
                            ''
                        }
                    </div>
                </div>
            `;
        }).join('');

        newsContainer.innerHTML = newsHTML;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Send ping to keep connection alive
    sendPing() {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({ type: 'ping' }));
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new EnhancedCryptoDashboard();
    
    // Send ping every 30 seconds to keep connection alive
    setInterval(() => {
        dashboard.sendPing();
    }, 30000);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page became visible, refresh connection if needed
        console.log('Page became visible, checking connection...');
    }
});
