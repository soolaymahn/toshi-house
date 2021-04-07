import ReconnectingWebSocket from "reconnecting-websocket";
import { SocketInfo } from "./SocketStore";

export const createSocket = (url: string) => {
  const options = {
    connectionTimeout: 1000,
    maxRetries: 10,
  };
  return new ReconnectingWebSocket(url, [], options);
};

export const send = (op: string, data: any, info: SocketInfo) => {
  const { peerId, socket } = info;
  const socketData = {
    op,
    d: data,
    peerId,
    platform: "web"
  };
  socket.send(JSON.stringify(socketData));
};

export type Handler = (data: any, socketInfo: SocketInfo) => void;

export const addOpListeners = (
  info: SocketInfo,
  handlers: Record<string, Handler>
) => {
  info.socket.addEventListener("message", function (e) {
    var message = JSON.parse(e.data);
    const handler = handlers[message.op];
    if (handler) {
      handler(message.d, info);
    }
  });
};
