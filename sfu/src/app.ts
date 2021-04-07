import {
  createConsumer,
  createTransport,
  startMediasoup,
  transportToOptions,
} from "./MediaUtils";
import { Router, Worker } from "mediasoup/lib/types";
import { createRabbit, startRabbit } from "./RabbitUtils";
import { Room } from "./types";

async function main() {
  let workers: {
    worker: Worker;
    router: Router;
  }[];
  try {
    workers = await startMediasoup();
  } catch (err) {
    console.log(err);
    throw err;
  }
  let workerIdx = 0;

  const getNextWorker = () => {
    const w = workers[workerIdx];
    workerIdx++;
    workerIdx %= workers.length;
    return w;
  };

  const createRoom = () => {
    const { worker, router } = getNextWorker();

    return { worker, router, state: {} } as Room;
  };

  const room: Room = createRoom();

  const { send, channel } = await createRabbit();
  startRabbit(channel, {
    "@get-recv-tracks": async ({ rtpCapabilities }, myPeerId) => {
      const { state, router } = room;
      const transport = state[myPeerId].recvTransport;
      if (!transport) {
        return;
      }
      const consumerParametersArr = [];

      for (const theirPeerId of Object.keys(state)) {
        const peerState = state[theirPeerId];
        if (theirPeerId === myPeerId || !peerState || !peerState.producer) {
          continue;
        }
        try {
          const { producer } = peerState;
          consumerParametersArr.push(
            await createConsumer(
              router,
              producer,
              rtpCapabilities,
              transport,
              myPeerId,
              state[theirPeerId]
            )
          );
        } catch (e) {
          continue;
        }
      }

      send({
        op: "@get-recv-tracks-done",
        platform: "sfu",
        d: { consumerParametersArr },
        peerId: myPeerId
      });
    },
    "@send-track": async (
      {
        transportId,
        direction,
        kind,
        rtpParameters,
        rtpCapabilities,
        paused,
        appData,
      },
      myPeerId
    ) => {
      const { state } = room;
      const { sendTransport, producer: previousProducer, consumers } = state[
        myPeerId
      ];
      const transport = sendTransport;

      if (!transport) {
        return;
      }
      if (previousProducer) {
        previousProducer.close();
        consumers.forEach((c) => c.close());
        // @todo give some time for frontends to get update, but this can be removed
        send({
          platform: "sfu",
          op: "close_consumer",
          d: { producerId: previousProducer.id },
        });
      }

      const producer = await transport.produce({
        kind,
        rtpParameters,
        paused,
        appData: { ...appData, peerId: myPeerId, transportId },
      });

      room.state[myPeerId].producer = producer;
      for (const theirPeerId of Object.keys(state)) {
        if (theirPeerId === myPeerId) {
          continue;
        }
        const peerTransport = state[theirPeerId]?.recvTransport;
        if (!peerTransport) {
          continue;
        }
        const d = await createConsumer(
          room.router,
          producer,
          rtpCapabilities,
          peerTransport,
          myPeerId,
          state[theirPeerId]
        );
        send({
          platform: "sfu",
          uid: theirPeerId,
          op: "new-peer-speaker",
          peer: myPeerId,
          d: { ...d },
        });
      }
      send({
        op: `@send-track-${direction}-done` as const,
        platform: "sfu",
        d: {
          id: producer.id,
        },
        peerId: myPeerId
      });
    },
    "@connect-transport": async ({ dtlsParameters, direction }, peerId) => {
      const { state } = room;
      const transport =
        direction === "recv"
          ? state[peerId].recvTransport
          : state[peerId].sendTransport;
      if (!transport) {
        return;
      }
      await transport.connect({ dtlsParameters });

      send({
        op: `@connect-transport-${direction}-done` as const,
        peerId,
        platform: "sfu",
      });
    },
    "add-speaker": async ({}, peerId) => {
      const { router } = room;
      const sendTransport = await createTransport("send", router, peerId);

      room.state[peerId].sendTransport?.close();
      room.state[peerId].sendTransport = sendTransport;

      send({
        op: "you-are-now-a-speaker",
        platform: "sfu",
        peerId,
        d: {
          sendTransportOptions: transportToOptions(sendTransport),
        },
      });
    },
    "join-as-speaker": async ({}, peerId) => {
      const { state, router } = room;

      const [recvTransport, sendTransport] = await Promise.all([
        createTransport("recv", router, peerId),
        createTransport("send", router, peerId),
      ]);

      room.state[peerId] = {
        recvTransport: recvTransport,
        sendTransport: sendTransport,
        consumers: [],
        producer: null,
      };

      send({
        op: "you-joined-as-speaker",
        platform: "sfu",
        peerId,
        d: {
          routerRtpCapabilities: room.router.rtpCapabilities,
          recvTransportOptions: transportToOptions(recvTransport),
          sendTransportOptions: transportToOptions(sendTransport),
        },
      });
    },
    "join-as-new-peer": async ({}, peerId) => {
      const { state, router } = room;
      const recvTransport = await createTransport("recv", router, peerId);
      room.state[peerId] = {
        recvTransport,
        consumers: [],
        producer: null,
        sendTransport: null,
      };

      send({
        op: "you-joined-as-peer",
        platform: "sfu",
        peerId,
        d: {
          routerRtpCapabilities: room.router.rtpCapabilities,
          recvTransportOptions: transportToOptions(recvTransport),
        },
      });
    }, 
    "join_room": async ({}, peerId) => {
      console.log('ayyyy')
      send({
        op: "join_room_ack",
        platform: "sfu",
        peerId,
        d: {
          loll: "lolll"
        }
      })
    },
  });
}

main();
