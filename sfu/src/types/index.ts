import { Consumer, Producer, Router, Transport, Worker } from "mediasoup/lib/types";

export type VoiceSendDirection = "recv" | "send";

export type Platform = "web";

export type Peer = {
  sendTransport: Transport | null;
  recvTransport: Transport | null;
  producer: Producer | null;
  consumers: Consumer[];
};

export type RoomState = Record<string, Peer>;

export type Room = { worker: Worker; router: Router; state: RoomState };