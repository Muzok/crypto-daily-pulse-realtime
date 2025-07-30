#!/usr/bin/env python3
"""
Simplified Real-time WebSocket Server for Testing
"""

import asyncio
import websockets
import json
import requests
import logging
from datetime import datetime
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleCryptoServer:
    def __init__(self):
        self.clients = set()
        self.current_prices = {
            'btc': {'price': 0, 'last_updated': None},
            'eth': {'price': 0, 'last_updated': None}
        }
        
    def fetch_coingecko_prices(self):
        """Fetch prices from CoinGecko API"""
        try:
            url = "https://api.coingecko.com/api/v3/simple/price"
            params = {
                'ids': 'bitcoin,ethereum',
                'vs_currencies': 'usd'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return {
                'btc': data.get('bitcoin', {}).get('usd', 0),
                'eth': data.get('ethereum', {}).get('usd', 0)
            }
        except Exception as e:
            logger.error(f"Error fetching CoinGecko prices: {e}")
            return None

    async def price_updater(self):
        """Update prices every 10 seconds"""
        while True:
            try:
                prices = self.fetch_coingecko_prices()
                if prices:
                    current_time = datetime.now().isoformat()
                    
                    self.current_prices['btc'] = {
                        'price': prices['btc'],
                        'last_updated': current_time
                    }
                    self.current_prices['eth'] = {
                        'price': prices['eth'],
                        'last_updated': current_time
                    }
                    
                    await self.broadcast_prices()
                    logger.info(f"Updated prices: BTC=${prices['btc']}, ETH=${prices['eth']}")
                    
            except Exception as e:
                logger.error(f"Error in price updater: {e}")
            
            await asyncio.sleep(10)  # Update every 10 seconds

    async def broadcast_prices(self):
        """Broadcast current prices to all connected clients"""
        if self.clients:
            message = json.dumps({
                'type': 'price_update',
                'data': self.current_prices,
                'timestamp': datetime.now().isoformat()
            })
            
            # Send to all clients
            disconnected_clients = set()
            for client in self.clients:
                try:
                    await client.send(message)
                except websockets.exceptions.ConnectionClosed:
                    disconnected_clients.add(client)
                except Exception as e:
                    logger.error(f"Error sending to client: {e}")
                    disconnected_clients.add(client)
            
            # Remove disconnected clients
            self.clients -= disconnected_clients
            logger.info(f"Broadcasted to {len(self.clients)} clients")

    async def handle_client(self, websocket):
        """Handle new client connections"""
        logger.info(f"New client connected from {websocket.remote_address}")
        self.clients.add(websocket)
        
        try:
            # Send current prices immediately
            await websocket.send(json.dumps({
                'type': 'price_update',
                'data': self.current_prices,
                'timestamp': datetime.now().isoformat()
            }))
            
            # Keep connection alive
            async for message in websocket:
                try:
                    data = json.loads(message)
                    if data.get('type') == 'ping':
                        await websocket.send(json.dumps({'type': 'pong'}))
                except json.JSONDecodeError:
                    logger.warning("Invalid JSON received from client")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client {websocket.remote_address} disconnected")
        except Exception as e:
            logger.error(f"Error handling client: {e}")
        finally:
            self.clients.discard(websocket)

    async def start_server(self, host='localhost', port=8765):
        """Start the WebSocket server"""
        logger.info(f"Starting simple crypto server on {host}:{port}")
        
        # Start price updater
        price_task = asyncio.create_task(self.price_updater())
        
        # Start WebSocket server
        server = await websockets.serve(self.handle_client, host, port)
        logger.info(f"Simple crypto server started on ws://{host}:{port}")
        
        try:
            await asyncio.gather(
                server.wait_closed(),
                price_task
            )
        except KeyboardInterrupt:
            logger.info("Server shutdown requested")
            price_task.cancel()
            server.close()
            await server.wait_closed()

async def main():
    """Main function to start the server"""
    server = SimpleCryptoServer()
    await server.start_server(host='0.0.0.0', port=8765)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Server error: {e}")

