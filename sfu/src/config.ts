import {
  RtpCodecCapability,
  TransportListenIp,
  WorkerLogTag,
} from "mediasoup/lib/types";

export const config = {
  // http server ip, port, and peer timeout constant
  //
  httpIp: "0.0.0.0",
  httpPort: 3000,
  httpPeerStale: 360000,

  mediasoup: {
    worker: {
      rtcMinPort: 50000,
      rtcMaxPort: 59999,
      logLevel: "debug",
      logTags: [
        "info",
        "ice",
        "dtls",
        "rtp",
        "srtp",
        "rtcp",
        // 'rtx',
        // 'bwe',
        // 'score',
        // 'simulcast',
        // 'svc'
      ] as WorkerLogTag[],
    },
    router: {
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
      ] as RtpCodecCapability[],
    },

    // rtp listenIps are the most important thing, below. you'll need
    // to set these appropriately for your network for the demo to
    // run anywhere but on localhost
    webRtcTransport: {
      listenIps: [
        {
          ip: "10.0.0.59",
        },
        // { ip: "192.168.42.68", announcedIp: null },
        // { ip: '10.10.23.101', announcedIp: null },
      ] as TransportListenIp[],
      initialAvailableOutgoingBitrate: 800000,
    },
  },
} as const;