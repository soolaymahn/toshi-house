import asyncio
import websockets
import pika
import nest_asyncio
import os

nest_asyncio.apply()

host = os.environ['AMQP_HOST']
key = os.environ['AMQP_KEY']


async def hello():
    uri = "ws://localhost:8765"
    async with websockets.connect(uri, ping_interval=None, ping_timeout=None) as websocket:
        def callback(ch, method, properties, body):
            print(" [x] Received %r" % body)
            asyncio.run(websocket.send(body.decode('utf-8')))

        credentials = pika.PlainCredentials(host, key)
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host='gull.rmq.cloudamqp.com', virtual_host='pgbavvth', credentials=credentials))
        channel = connection.channel()

        channel.queue_declare(queue='api_queue', durable=True)
        channel.basic_consume(queue='api_queue', on_message_callback=callback, auto_ack=True)
        channel.start_consuming()


asyncio.get_event_loop().run_until_complete(hello())
asyncio.get_event_loop().run_forever()
