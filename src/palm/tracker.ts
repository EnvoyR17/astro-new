import { FilesetResolver, HandLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { Pt } from "./geometry";

const WASM = `${import.meta.env.BASE_URL}mediapipe/wasm`;
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let filesetPromise: ReturnType<typeof FilesetResolver.forVisionTasks> | null = null;
let modelPrefetch: Promise<unknown> | null = null;
let videoReady: Promise<HandLandmarker> | null = null;

function fileset() {
  if (!filesetPromise) filesetPromise = FilesetResolver.forVisionTasks(WASM);
  return filesetPromise;
}

function prefetchModel() {
  if (!modelPrefetch) {
    modelPrefetch = fetch(MODEL, { mode: "cors", credentials: "omit" }).catch(() => {
      modelPrefetch = null;
    });
  }
  return modelPrefetch;
}

async function create(mode: "VIDEO" | "IMAGE") {
  const [, fs] = await Promise.all([prefetchModel(), fileset()]);
  return HandLandmarker.createFromOptions(fs, {
    baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
    runningMode: mode,
    numHands: 1,
    minHandDetectionConfidence: 0.35,
    minHandPresenceConfidence: 0.35,
    minTrackingConfidence: 0.35,
  });
}

/** Start WASM + model + VIDEO landmarker before the camera screen. */
export function warmPalmRuntime() {
  prefetchModel();
  void fileset();
  if (!videoReady) {
    videoReady = create("VIDEO").catch((err) => {
      videoReady = null;
      throw err;
    });
  }
  return videoReady;
}

/** Reuse the warmed VIDEO instance; otherwise create one. */
export async function openVideoLandmarker() {
  const pending = videoReady;
  videoReady = null;
  if (pending) {
    try {
      return await pending;
    } catch {
      return create("VIDEO");
    }
  }
  return create("VIDEO");
}

let imageMarker: HandLandmarker | null = null;

export async function getImageLandmarker() {
  if (!imageMarker) imageMarker = await create("IMAGE");
  return imageMarker;
}

export function toPts(landmarks: NormalizedLandmark[]): Pt[] {
  return landmarks.map((p) => ({ x: p.x, y: p.y }));
}

export async function detectImagePts(img: HTMLImageElement): Promise<Pt[] | null> {
  const marker = await getImageLandmarker();
  const res = marker.detect(img);
  const lm = res.landmarks?.[0];
  return lm ? toPts(lm) : null;
}
