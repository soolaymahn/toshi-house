import {
  Consumer,
  Device,
  Producer,
  Transport,
} from "mediasoup-client/lib/types";
import { createStore, createHook, StoreActionApi } from "react-sweet-state";
import { send } from "../websocket/utils";
import {
  loadDevice,
  createTransport,
  sendAudio,
  consumeAudio,
  createDevice,
} from "./utils";

type MediaState = {
  connectRecvCallback: () => void;
  connectRecvErrback: () => void;
  connectSendCallback: () => void;
  connectSendErrback: () => void;
  produceCallback: () => void;
  produceErrback: () => void;
  device: Device | null;
  sendTransport: Transport | null;
  recvTransport: Transport | null;
  consumerMap: Record<string, Consumer>;
  producer: Producer | null;
  micStream: MediaStream | null;
};

// TODO: different send/receive connect transport callbacks
const initialState: MediaState = {
  connectRecvCallback: () => {},
  connectRecvErrback: () => {},
  connectSendCallback: () => {},
  connectSendErrback: () => {},
  produceCallback: () => {},
  produceErrback: () => {},
  consumerMap: {},
  producer: null,
  device: null,
  sendTransport: null,
  recvTransport: null,
  micStream: null,
};

const getVoiceTracks = (socket) => async ({ getState }) => {
  send(
    "@get-recv-tracks",
    {
      rtpCapabilities: getState().device!.rtpCapabilities,
    },
    socket
  );
};

const createRecvTransport = (data, socket) => async ({
  getState,
  setState,
}) => {
  // TODO: catch
  const recvTransport = createTransport(
    getState().device!,
    "recv",
    data.recvTransportOptions
  );
  setState({ recvTransport });
  recvTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    send("@connect-transport", { dtlsParameters, direction: "recv" }, socket);
    setState({ connectRecvCallback: callback, connectRecvErrback: errback });
  });
};

const createSendTransport = (data, socket, device) => async ({
  getState,
  setState,
}) => {
  // TODO: catch
  const sendTransport = createTransport(
    getState().device!,
    "send",
    data.sendTransportOptions
  );
  setState({ sendTransport });
  sendTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    send("@connect-transport", { dtlsParameters, direction: "send" }, socket);
    setState({ connectSendCallback: callback, connectSendErrback: errback });
  });
  sendTransport.on(
    "produce",
    async ({ kind, rtpParameters, appData }, callback, errback) => {
      // send more info
      send(
        "@send-track",
        {
          kind,
          rtpParameters,
          appData,
          rtpCapabilities: device!.rtpCapabilities,
          transportId: data.sendTransportOptions.id,
          direction: "send",
          pasued: false,
        },
        socket
      );
      setState({ produceCallback: callback, produceErrback: errback });
    }
  );
};

const addConsumer = (data) => async ({ getState, setState }) => {
  const consumer = await consumeAudio(
    getState().recvTransport,
    data.consumerParameters
  );
  setState({
    consumerMap: { ...getState().consumerMap, [data.peerId]: consumer },
  });
};

const actions = {
  initDevice: () => ({ getState, setState }) => {
    const device = createDevice();
    setState({ device });
    console.log(getState());
  },
  handleConnectTransportDone: (direction) => ({
    getState,
    setState,
    dispatch,
  }) => {
    if (false) {
      if (direction === "send") {
        getState().connectSendErrback();
      } else {
        getState().connectRecvErrback();
      }
    } else {
      if (direction === "send") {
        getState().connectSendCallback();
      } else {
        getState().connectRecvCallback();
      }
    }
  },
  handleTransportProduceDone: ({ id }) => ({
    getState,
    setState,
    dispatch,
  }) => {
    if (false) {
      getState().produceErrback();
    } else {
      getState().produceCallback({ id });
    }
  },
  handleRecvTracksDone: ({ consumerParametersArr }) => async ({
    getState,
    setState,
    dispatch,
  }) => {
    console.log("consuming audio");
    for (const consumerParam of consumerParametersArr) {
      await dispatch(addConsumer(consumerParam));
    }
  },
  newPeerSpeaker: (data) => async ({ getState, setState, dispatch }) => {
    dispatch(addConsumer(data));
  },
  youAreNowASpeaker: (data, socket, device) => async ({
    getState,
    setState,
    dispatch,
  }) => {
    await dispatch(createSendTransport(data, socket, device));
    await sendAudio(getState().sendTransport!);
  },
  youJoinedAsAPeer: (data, socket) => async ({
    getState,
    setState,
    dispatch,
  }) => {
    await loadDevice(getState().device!, data.routerRtpCapabilities);
    await dispatch(createRecvTransport(data, socket));
    dispatch(getVoiceTracks(socket));
  },
  youJoinedAsASpeaker: (data, socket, device) => async ({
    getState,
    setState,
    dispatch,
  }) => {
    console.log("load device");
    await loadDevice(getState().device!, data.routerRtpCapabilities);
    console.log("create send transport");
    await dispatch(createSendTransport(data, socket, device));
    console.log("send audio");
    const { producer, micStream } = await sendAudio(getState().sendTransport!);
    setState({ producer, micStream });
    console.log("create recv transport");
    await dispatch(createRecvTransport(data, socket));
    console.log("get voice tracks");
    dispatch(getVoiceTracks(socket));
  },
  youLeftTheRoom: () => () => {},
  closeAll: () => () => {},
};

const MediaStore = createStore({ initialState, actions });
export const useMedia = createHook(MediaStore);
