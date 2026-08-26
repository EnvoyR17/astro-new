import { FilesetResolver, HandLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { Pt } from "./geometry";

const WASM = `${import.meta.env.BASE_URL}mediapipe/wasm`;
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let filesetPromise: ReturnType<typeof FilesetResolver.forVisionTasks> | null = null;

function fileset() {
  if (!filesetPromise) filesetPromise = FilesetResolver.forVisionTasks(WASM);
  return filesetPromise;
}

async function create(mode: "VIDEO" | "IMAGE") {
  const fs = await fileset();
  return HandLandmarker.createFromOptions(fs, {
    baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
    runningMode: mode,
    numHands: 1,
    minHandDetectionConfidence: 0.35,
    minHandPresenceConfidence: 0.35,
    minTrackingConfidence: 0.35,
  });
}

/** New instance per camera session so timestamps and WASM state reset. */
export async function openVideoLandmarker() {
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
