import React from "react";
import { Button } from "react-bootstrap";
import { useMedia } from "../media/MediaStore";
import { useSocket } from "../websocket/SocketStore";

interface JoinButtonProps {
  roomId: string;
}

export const JoinButton: React.FC<JoinButtonProps> = ({}) => {
  const [socketState, socketActions] = useSocket();

  return (
    <>
      <Button
        onClick={() => {
          socketActions.join();
        }}
      >
        Join
      </Button>
    </>
  );
};
