import { useEffect, useRef, useState } from "react";
import { openVideoLandmarker, toPts } from "./tracker";
import { coverDrawImage, drawSkeleton, remapToFitted, type Pt } from "./geometry";

type Props = {
  onCapture: (blob: Blob, landmarks: Pt[]) => void;
  onCancel: () => void;
  onSkip: () => void;
  /** Camera permission denied / unavailable — close and show Skip on the guide. */
  onDenied?: () => void;
};

export function PalmCamera({ onCapture, onCancel, onSkip, onDenied }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const freezeRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onCaptureRef = useRef(onCapture);
  onCaptureRef.current = onCapture;
  const onDeniedRef = useRef(onDenied);
  onDeniedRef.current = onDenied;

  const [found, setFound] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const foundRef = useRef(false);
  const captureNow = useRef<() => void>(() => {});

  useEffect(() => {
    let gone = false;
    let raf = 0;
    let lastTs = -1;
    let hits = 0;
    let locked = false;
    let lastPts: Pt[] | null = null;
    let landmarker: Awaited<ReturnType<typeof openVideoLandmarker>> | null = null;

    const stopStream = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };

    const sizeCanvases = () => {
      const wrap = wrapRef.current;
      if (!wrap) return false;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w < 2 || h < 2) return false;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const tw = Math.round(w * dpr);
      const th = Math.round(h * dpr);
      for (const c of [overlayRef.current, freezeRef.current]) {
        if (!c) continue;
        if (c.width !== tw || c.height !== th) {
          c.width = tw;
          c.height = th;
        }
      }
      return true;
    };

    const freeze = (pts: Pt[]) => {
      if (locked) return;
      locked = true;
      const video = videoRef.current;
      const freezeCv = freezeRef.current;
      if (!video || !freezeCv || video.readyState < 2) {
        locked = false;
        return;
      }
      cancelAnimationFrame(raf);
      sizeCanvases();
      const fctx = freezeCv.getContext("2d");
      if (!fctx) return;
      coverDrawImage(fctx, video, video.videoWidth, video.videoHeight);
      freezeCv.style.opacity = "1";
      video.style.opacity = "0";
      const overlay = overlayRef.current;
      overlay?.getContext("2d")?.clearRect(0, 0, overlay.width, overlay.height);
      stopStream();
      const ptsOnPhoto = remapToFitted(
        pts,
        video.videoWidth,
        video.videoHeight,
        freezeCv.width,
        freezeCv.height,
        "cover",
      );
      freezeCv.toBlob(
        (blob) => {
          if (gone || !blob) return;
          onCaptureRef.current(blob, ptsOnPhoto);
        },
        "image/jpeg",
        0.86,
      );
    };

    captureNow.current = () => {
      if (lastPts && lastPts.length >= 21) freeze(lastPts);
    };

    (async () => {
      const openCam = async () => {
        try {
          return await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch {
          return navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        }
      };

      try {
        let stream: MediaStream | null = null;
        try {
          stream = await openCam();
        } catch {
          await new Promise((r) => setTimeout(r, 250));
          if (gone) return;
          stream = await openCam();
        }
        if (gone) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        if (gone) return;
        sizeCanvases();
        landmarker = await openVideoLandmarker();
        if (gone) {
          landmarker.close();
          return;
        }
        setReady(true);

        const loop = () => {
          if (gone || locked) return;
          raf = requestAnimationFrame(loop);
          if (!sizeCanvases()) return;
          const overlay = overlayRef.current;
          const octx = overlay?.getContext("2d");
          if (!overlay || !octx || !landmarker || video.readyState < 2 || !video.videoWidth) return;

          let ts = performance.now();
          if (ts <= lastTs) ts = lastTs + 1;
          lastTs = ts;

          let res;
          try {
            res = landmarker.detectForVideo(video, ts);
          } catch {
            return;
          }

          octx.clearRect(0, 0, overlay.width, overlay.height);
          const lm = res.landmarks?.[0];
          if (lm && lm.length >= 21) {
            const pts = toPts(lm);
            lastPts = pts;
            drawSkeleton(octx, pts, video.videoWidth, video.videoHeight);
            hits = Math.min(hits + 1, 40);
            if (!foundRef.current) {
              foundRef.current = true;
              setFound(true);
            }
            if (hits >= 10) freeze(pts);
          } else {
            lastPts = null;
            hits = Math.max(0, hits - 2);
            if (foundRef.current && hits === 0) {
              foundRef.current = false;
              setFound(false);
            }
          }
        };
        raf = requestAnimationFrame(loop);
      } catch {
        if (!gone) {
          setError("Нет доступа к камере. Разреши съёмку или загрузи фото из галереи.");
          onDeniedRef.current?.();
        }
      }
    })();

    return () => {
      gone = true;
      locked = true;
      cancelAnimationFrame(raf);
      stopStream();
      try {
        landmarker?.close();
      } catch {
        /* already closed */
      }
    };
  }, []);

  return (
    <div className="palm-cam" ref={wrapRef}>
      <video ref={videoRef} className="palm-cam-video" playsInline muted autoPlay />
      <canvas ref={freezeRef} className="palm-cam-freeze" />
      <canvas ref={overlayRef} className="palm-cam-overlay" />
      <div className="palm-cam-ui">
        <div className={`palm-cam-pill${found ? " on" : ""}`}>
          <span className="palm-cam-dot" />
          {found ? "ЛАДОНЬ ОБНАРУЖЕНА" : "ИЩЕМ ЛАДОНЬ..."}
        </div>
        {!found ? <p className="palm-cam-hint">Помести левую ладонь в кадр и разведи пальцы.</p> : null}
        {error ? <p className="palm-cam-hint">{error}</p> : null}
        <div className="palm-cam-bar">
          <button type="button" className="palm-cam-txt tap" onClick={onCancel}>
            Отмена
          </button>
          <button
            type="button"
            className="palm-cam-shutter tap"
            aria-label="Сфотографировать"
            disabled={!ready}
            onClick={() => captureNow.current()}
          />
          <button type="button" className="palm-cam-txt tap" onClick={onSkip}>
            Пропустить
          </button>
        </div>
      </div>
    </div>
  );
}
