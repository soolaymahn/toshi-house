import { Device } from "mediasoup-client";
import {
  detectDevice,
  RtpCapabilities,
  Transport,
} from "mediasoup-client/lib/types";
import { TransportOptions } from "mediasoup-client/lib/types";

export const createDevice = () => {
  try {
    let handlerName = detectDevice();
    if (!handlerName) {
      handlerName = "Chrome74";
    }
    return new Device({ handlerName });
  } catch {
    return null;
  }
};

export const createTransport = (
  device: Device,
  direction: "recv" | "send",
  transportOptions: TransportOptions
) => {
  return direction === "recv"
    ? device!.createRecvTransport(transportOptions)
    : device!.createSendTransport(transportOptions);
};

export const consumeAudio = async (
  transport: Transport,
  consumerParameters: any
) => {
  return await transport.consume({
    ...consumerParameters,
  });
};

export const loadDevice = async (
  device: Device,
  routerRtpCapabilities: RtpCapabilities
) => {
  if (!device!.loaded) {
    await device!.load({ routerRtpCapabilities });
  }
};

export const sendAudio = async (transport: Transport) => {
  let micStream: MediaStream;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
  } catch (err) {
    console.log(err);
    return { producer: null, micStream: null, track: null };;
  }

  console.log(micStream);

  const audioTracks = micStream.getAudioTracks();

  if (audioTracks.length) {
    const track = audioTracks[0];
    const producer = await transport.produce({
      track: track,
      appData: { mediaTag: "cam-audio" },
    });
    console.log("jkfjsdl", producer);
    track.enabled = true;
    return { producer, micStream, track };
  }
  return { producer: null, micStream, track: null };
};

// mic.enabled = !muted
