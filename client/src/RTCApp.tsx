import React, { useEffect } from "react";
import { AudioRenderer } from "./components/AudioRenderer";
import { useInitConnections } from "./hooks/useInitConnections";

interface RTCAppProps {}

export const RTCApp: React.FC<RTCAppProps> = ({}) => {
  useInitConnections();
  return (
    <>
      <div>ayyyyyyy</div>
      <AudioRenderer />
    </>
  );
};
