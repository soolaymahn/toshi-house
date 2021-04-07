import {
  ConsumerType,
  Producer,
  Router,
  RtpCapabilities,
  RtpParameters,
  Transport,
  Worker,
  WebRtcTransport,
} from "mediasoup/lib/types";
import { config } from "./config";
import os from "os";
import * as mediasoup from "mediasoup";
import { Peer, VoiceSendDirection } from "./types";

export async function startMediasoup() {
  const workers: Array<{
    worker: Worker;
    router: Router;
  }> = [];
  for (let i = 0; i < Object.keys(os.cpus()).length; i++) {
    let worker = await mediasoup.createWorker({
      logLevel: config.mediasoup.worker.logLevel,
      logTags: config.mediasoup.worker.logTags,
      rtcMinPort: config.mediasoup.worker.rtcMinPort,
      rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });

    worker.on("died", () => {
      console.error("mediasoup worker died (this should never happen)");
      process.exit(1);
    });

    const mediaCodecs = config.mediasoup.router.mediaCodecs;
    const router = await worker.createRouter({ mediaCodecs });

    workers.push({ worker, router });
  }

  return workers;
}

export const createConsumer = async (
  router: Router,
  producer: Producer,
  rtpCapabilities: RtpCapabilities,
  transport: Transport,
  peerId: string,
  peerConsuming: Peer
) => {
  if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) {
    throw new Error(
      `recv-track: client cannot consume ${producer.appData.peerId}`
    );
  }

  const consumer = await transport.consume({
    producerId: producer.id,
    rtpCapabilities,
    paused: false, // see note above about always starting paused
    appData: { peerId, mediaPeerId: producer.appData.peerId },
  });

  peerConsuming.consumers.push(consumer);

  return {
    peerId: producer.appData.peerId,
    consumerParameters: {
      producerId: producer.id,
      id: consumer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      producerPaused: consumer.producerPaused,
    },
  };
};

export const createTransport = async (
  direction: VoiceSendDirection,
  router: Router,
  peerId: string
) => {
  const {
    listenIps,
    initialAvailableOutgoingBitrate,
  } = config.mediasoup.webRtcTransport;

  const transport = await router.createWebRtcTransport({
    listenIps: listenIps,
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: initialAvailableOutgoingBitrate,
    appData: { peerId, clientDirection: direction },
  });
  return transport;
};

export const transportToOptions = ({
  id,
  iceParameters,
  iceCandidates,
  dtlsParameters,
}: WebRtcTransport) => ({ id, iceParameters, iceCandidates, dtlsParameters });

export type TransportOptions = ReturnType<typeof transportToOptions>;