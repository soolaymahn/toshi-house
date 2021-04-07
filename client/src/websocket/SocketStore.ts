import ReconnectingWebSocket from "reconnecting-websocket";
import { addOpListeners, createSocket, Handler, send } from "./utils";
import { createStore, createHook, StoreActionApi } from "react-sweet-state";

export type SocketInfo = {
  socket: ReconnectingWebSocket
  peerId: string
}

type SocketState = {
  info: SocketInfo | null;
};

const initialState: SocketState = {
  info: null,
};

const actions = {
  initSocket: (url: string, handlers: Record<string, Handler>) => ({
    getState,
    setState,
  }) => {
    const socket = createSocket(url);
    const peerId = Math.floor((Math.random() * 1000000) + 1).toString()
    const info: SocketInfo = {socket,  peerId}
    addOpListeners(info, handlers);
    setState({ info });
  },
  join: () => ({ getState, setState }) => {
    send('join-as-speaker', {}, getState().info)
  },
};

const SocketStore = createStore({ initialState, actions });
export const useSocket = createHook(SocketStore);
