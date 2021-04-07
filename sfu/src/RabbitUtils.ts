import amqp, { Connection } from "amqplib";

export type SendFunc = (message: any) => void;

export type HandlerMap = {
  [key: string]: (data: any, peerId: string) => void;
};

const out_queue = "api_queue";
const in_queue = "sfu_queue";

export const createRabbit = async () => {
  const conn = await amqp.connect("");
  const channel = await conn.createChannel();

  await Promise.all([
    channel.assertQueue(out_queue),
    channel.assertQueue(in_queue),
  ]);

  const send = (obj: any) => {
    channel.sendToQueue(out_queue, Buffer.from(JSON.stringify(obj)));
  };
  return { send, channel };
};

export const startRabbit = async (
  channel: amqp.Channel,
  handlerMap: HandlerMap
) => {
  await channel.purgeQueue(in_queue);

  await channel.consume(
    in_queue,
    async (e) => {
      const m = e?.content.toString();
      if (m) {
        let data: any;
        try {
          data = JSON.parse(m);
        } catch {}
        if (data && data.op) {
          await handlerMap[data.op](data.d, data.peerId);
        }
      }
    }
    // { noAck: true }
  );
};
