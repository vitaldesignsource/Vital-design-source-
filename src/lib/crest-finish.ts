export type CrestFinishRole = "feather" | "flourish" | "solid";

export interface CrestFinish {
  readonly role: CrestFinishRole;
  readonly faceOpacity: number;
  readonly edgeOpacity: number;
}

const solid: CrestFinish = {
  role: "solid",
  faceOpacity: 1,
  edgeOpacity: 1,
};
const feather: CrestFinish = {
  role: "feather",
  faceOpacity: 0.89,
  edgeOpacity: 0.96,
};
const flourish: CrestFinish = {
  role: "flourish",
  faceOpacity: 0.95,
  edgeOpacity: 0.98,
};
const flourishes = new Set([18, 19, 20, 21, 22, 23]);

/** Hero finish only; the shield, lettering, nibs, and main wings stay solid. */
export function getCrestFinish(pathIndex: number): CrestFinish {
  if (pathIndex === 7 || pathIndex === 8) return feather;
  if (flourishes.has(pathIndex)) return flourish;
  return solid;
}
