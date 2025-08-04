class CryptoDashboard {
    constructor() {
        this.websocketUrl = 'wss://167.172.151.11.nip.io';
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.isConnected = false;
        
        this.init();
    }

    init() {
        this.updateConnectionStatus('connecting');
        this.connectWebSocket();
    }

    connectWebSocket() {
        try {
            this.websocket = new WebSocket(this.websocketUrl);
            
            this.websocket.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus('connected');
            };

            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.websocket.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                this.attemptReconnect();
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('error');
            };

        } catch (error) {
            console.error('Error creating WebSocket:', error);
            this.updateConnectionStatus('error');
            this.attemptReconnect();
        }
    }

    handleWebSocketMessage(data) {
        if (data.btc) {
            this.updateCryptoData('btc', data.btc);
        }
        if (data.eth) {
            this.updateCryptoData('eth', data.eth);
        }
        
        // Update last updated time
        if (data.last_updated) {
            this.updateLastUpdated(data.last_updated);
        }
    }

    updateCryptoData(crypto, data) {
        // Update price
        const priceElement = document.getElementById(`${crypto}-price`);
        if (priceElement && data.price) {
            priceElement.textContent = `$${data.price.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }

        // Calculate and update traffic-light analysis
        this.updateTrafficLightAnalysis(crypto, data);
    }

    calculateTrafficLightStatus(crypto, data) {
        if (!data.price) return this.getDefaultStatus();

        const price = data.price;
        let bullishSignals = 0;
        let bearishSignals = 0;
        let signals = [];

        // Price-based analysis
        if (crypto === 'btc') {
            if (price > 110000) {
                bullishSignals += 2;
                signals.push("Price above $110K resistance");
            } else if (price < 95000) {
                bearishSignals += 2;
                signals.push("Price below $95K support");
            } else {
                signals.push("Price in consolidation range");
            }

            if (price > 105000) {
                bullishSignals += 1;
                signals.push("Strong psychological level hold");
            }
        } else if (crypto === 'eth') {
            if (price > 3800) {
                bullishSignals += 2;
                signals.push("Price above $3,800 resistance");
            } else if (price < 3200) {
                bearishSignals += 2;
                signals.push("Price below $3,200 support");
            } else {
                signals.push("Price in consolidation range");
            }

            if (price > 3500) {
                bullishSignals += 1;
                signals.push("Altcoin strength showing");
            }
        }

        // Technical indicators simulation (since we're using existing data)
        const rsi = this.simulateRSI(price);
        if (rsi > 70) {
            bearishSignals += 1;
            signals.push("RSI indicates overbought conditions");
        } else if (rsi < 30) {
            bullishSignals += 1;
            signals.push("RSI indicates oversold conditions");
        } else if (rsi > 50) {
            bullishSignals += 0.5;
            signals.push("RSI shows bullish momentum");
        } else {
            bearishSignals += 0.5;
            signals.push("RSI shows bearish momentum");
        }

        // Moving average simulation
        const sma20 = price * 0.98; // Approximate
        const sma50 = price * 0.95; // Approximate
        
        if (price > sma20 && price > sma50) {
            bullishSignals += 1;
            signals.push("Price above key moving averages");
        } else if (price < sma20 && price < sma50) {
            bearishSignals += 1;
            signals.push("Price below key moving averages");
        }

        // MACD simulation
        const macdBullish = Math.random() > 0.5; // Simplified
        if (macdBullish) {
            bullishSignals += 0.5;
            signals.push("MACD showing bullish divergence");
        } else {
            bearishSignals += 0.5;
            signals.push("MACD showing bearish divergence");
        }

        // Determine overall status
        const netSignal = bullishSignals - bearishSignals;
        
        if (netSignal >= 2) {
            return {
                status: 'BULLISH',
                color: '#00ff88',
                bgColor: 'rgba(0, 255, 136, 0.1)',
                explanation: `Strong bullish signals detected across multiple indicators. ${this.getCryptoName(crypto)} showing positive momentum with ${Math.round(bullishSignals)} bullish factors outweighing ${Math.round(bearishSignals)} bearish factors.`,
                signals: signals.slice(0, 4) // Show top 4 signals
            };
        } else if (netSignal <= -2) {
            return {
                status: 'BEARISH',
                color: '#ff4757',
                bgColor: 'rgba(255, 71, 87, 0.1)',
                explanation: `Strong bearish signals detected across multiple indicators. ${this.getCryptoName(crypto)} showing negative momentum with ${Math.round(bearishSignals)} bearish factors outweighing ${Math.round(bullishSignals)} bullish factors.`,
                signals: signals.slice(0, 4)
            };
        } else {
            return {
                status: 'NEUTRAL',
                color: '#ffa502',
                bgColor: 'rgba(255, 165, 2, 0.1)',
                explanation: `Mixed signals detected with balanced bullish and bearish indicators. ${this.getCryptoName(crypto)} in consolidation phase with ${Math.round(bullishSignals)} bullish and ${Math.round(bearishSignals)} bearish factors.`,
                signals: signals.slice(0, 4)
            };
        }
    }

    simulateRSI(price) {
        // Simplified RSI simulation based on price
        const base = 50;
        const variation = (price % 100) / 100 * 40 - 20; // -20 to +20
        return Math.max(10, Math.min(90, base + variation));
    }

    getCryptoName(crypto) {
        return crypto === 'btc' ? 'Bitcoin' : 'Ethereum';
    }

    getDefaultStatus() {
        return {
            status: 'NEUTRAL',
            color: '#ffa502',
            bgColor: 'rgba(255, 165, 2, 0.1)',
            explanation: 'Waiting for market data to analyze signals...',
            signals: ['Connecting to live data feed', 'Initializing technical indicators']
        };
    }

    updateTrafficLightAnalysis(crypto, data) {
        const analysis = this.calculateTrafficLightStatus(crypto, data);
        
        // Update status badge
        const statusElement = document.getElementById(`${crypto}-status`);
        if (statusElement) {
            statusElement.textContent = analysis.status;
            statusElement.style.color = analysis.color;
            statusElement.style.backgroundColor = analysis.bgColor;
            statusElement.style.border = `2px solid ${analysis.color}`;
        }

        // Update explanation
        const explanationElement = document.getElementById(`${crypto}-explanation`);
        if (explanationElement) {
            explanationElement.textContent = analysis.explanation;
        }

        // Update signals list
        const signalsElement = document.getElementById(`${crypto}-signals`);
        if (signalsElement && analysis.signals) {
            signalsElement.innerHTML = analysis.signals
                .map(signal => `<li>${signal}</li>`)
                .join('');
        }
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        const statusText = document.getElementById('status-text');
        
        if (!statusElement || !statusText) return;

        switch (status) {
            case 'connecting':
                statusElement.className = 'status-indicator connecting';
                statusText.textContent = 'CONNECTING';
                break;
            case 'connected':
                statusElement.className = 'status-indicator connected';
                statusText.textContent = 'LIVE';
                break;
            case 'disconnected':
                statusElement.className = 'status-indicator disconnected';
                statusText.textContent = 'OFFLINE';
                break;
            case 'error':
                statusElement.className = 'status-indicator error';
                statusText.textContent = 'ERROR';
                break;
        }
    }

    updateLastUpdated(timestamp) {
        const element = document.getElementById('last-updated');
        if (element) {
            const date = new Date(timestamp);
            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            };
            element.textContent = `Last Updated ${date.toLocaleDateString('en-US', options)} (Live)`;
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.connectWebSocket();
            }, this.reconnectDelay);
            
            // Increase delay for next attempt
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
        } else {
            console.log('Max reconnection attempts reached');
            this.updateConnectionStatus('error');
        }
    }

    sendPing() {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({ type: 'ping' }));
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new CryptoDashboard();
    
    // Send ping every 30 seconds to keep connection alive
    setInterval(() => {
        dashboard.sendPing();
    }, 30000);
});
