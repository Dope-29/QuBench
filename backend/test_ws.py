import asyncio
import websockets

async def test_ws():
    uri = "ws://localhost:8000/ws/simulate"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Successfully connected!")
            # Send a dummy packet
            # await websocket.send('{"type":"ping"}')
            # we just want to see if it accepts the connection
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
