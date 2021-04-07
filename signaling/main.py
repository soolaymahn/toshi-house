import asyncio
import websockets
import pika
import json

USERS = {}

credentials = pika.PlainCredentials('', '')
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='gull.rmq.cloudamqp.com', virtual_host='pgbavth', credentials=credentials))
channel = connection.channel()
channel.queue_declare(queue='sfu_queue', durable=True)


async def hello(websocket, path):
    print("ayy")
    while True:
        data_str = await websocket.recv()
        data = json.loads(data_str)
        print(data)
        if "peerId" in data:
            platform = data["platform"]
            peer_id = data["peerId"]
            if platform == "sfu":
                send_socket = USERS[peer_id]
                await send_socket.send(data_str)
            elif platform == "web":
                if peer_id not in USERS:
                    USERS[peer_id] = websocket
                print("sent")
                channel.basic_publish('', 'sfu_queue', data_str.encode('utf-8'))


def callback(ch, method, properties, body):
    print(" [x] Received %r" % body)


start_server = websockets.serve(hello, "localhost", 8765, ping_interval=None, ping_timeout=None)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
