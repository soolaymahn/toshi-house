import { Consumer } from "mediasoup-client/lib/Consumer";
import React, { useRef, useEffect } from "react";
import { useMedia } from "../media/MediaStore";

interface AudioRendererProps {
}

const MyAudio = ({
  volume,
  onRef,
  debug,
  ...props
}: React.DetailedHTMLProps<
  React.AudioHTMLAttributes<HTMLAudioElement>,
  HTMLAudioElement
> & {
  onRef: (a: HTMLAudioElement) => void;
  volume: number;
  debug?: boolean;
}) => {
  const myRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (myRef.current) {
      myRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <audio
      ref={(r) => {
        if (debug && r) {
          console.log("audio-debug", {
            currentTime: r.currentTime,
            paused: r.paused,
            ended: r.ended,
            readyState: r.readyState,
            duration: r.duration,
            volume: r.volume,
          });
          if (r.dataset.debugPlay !== "true") {
            r.dataset.debugPlay = "true";
            r.play()
              .then(() => console.log("debug-play-then"))
              .catch((err) => {
                console.log("debug-play-catch", err);
              });
          }
        }
        // @todo
        if (r && !myRef.current) {
          (myRef as any).current = r;
          onRef(r);
        }
      }}
      {...props}
    />
  );
};

export const AudioRenderer: React.FC<AudioRendererProps> = () => {
  const audioRefs = useRef<[string, HTMLAudioElement][]>([]);
  const [mediaState] = useMedia();

  console.log("rendering consumers", mediaState.consumerMap)
  return (
    <>
      {Object.keys(mediaState.consumerMap).map((k) => {
        const consumer = mediaState.consumerMap[k];
        return (
          <MyAudio
            volume={1.0}
            // autoPlay
            playsInline
            controls={false}
            key={consumer.id}
            onRef={(a) => {
              audioRefs.current.push([k, a]);
              a.srcObject = new MediaStream([consumer.track]);
              a.play().catch((error) => {
                console.warn("audioElem.play() failed:%o", error);
              });
            }}
          />
        );
      })}
    </>
  );
};
