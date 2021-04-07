import { useMedia } from "../media/MediaStore";
import { useSocket } from "../websocket/SocketStore";
import { useEffect } from "react";

export const useInitConnections = () => {
  const [mediaState, mediaActions] = useMedia();
  const [socketState, socketActions] = useSocket();

  useEffect(() => {
    if (mediaState.device && !socketState.info) {
      socketActions.initSocket("ws://localhost:8765", {
        "new-peer-speaker": (data) => {
          mediaActions.newPeerSpeaker(data);
        },
        "you-are-now-a-speaker": (data, socket) => {
          mediaActions.youAreNowASpeaker(data, socket, mediaState.device);
        },
        "you-joined-as-peer": (data, socket) => {
          mediaActions.youJoinedAsAPeer(data, socket);
        },
        "you-joined-as-speaker": (data, socket) => {
          mediaActions.youJoinedAsASpeaker(data, socket, mediaState.device);
        },
        "@connect-transport-send-done": (data) => {
          mediaActions.handleConnectTransportDone("send");
        },
        "@connect-transport-recv-done": (data) => {
          mediaActions.handleConnectTransportDone("recv");
        },
        "@send-track-send-done": (data) => {
          mediaActions.handleTransportProduceDone(data);
        },
        "@get-recv-tracks-done": (data) => {
          mediaActions.handleRecvTracksDone(data);
        },
      });
    }
  }, [mediaState.device])

  useEffect(() => {
    if (!mediaState.device) {
      mediaActions.initDevice();
    }
  }, []);
};
