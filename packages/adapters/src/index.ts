export const ADAPTERS_VERSION = "0.1.0";
export * from "./common.js";
export { aceternityAdapter } from "./aceternity.js";
export { beautifuluiAdapter } from "./beautifului.js";
export { beuiAdapter } from "./beui.js";
export { herouiAdapter } from "./heroui.js";
export { efferdAdapter } from "./efferd.js";

import { aceternityAdapter } from "./aceternity.js";
import { beautifuluiAdapter } from "./beautifului.js";
import { beuiAdapter } from "./beui.js";
import { efferdAdapter } from "./efferd.js";
import { herouiAdapter } from "./heroui.js";

export const adapters = {
  aceternity: aceternityAdapter,
  beautifului: beautifuluiAdapter,
  beui: beuiAdapter,
  heroui: herouiAdapter,
  efferd: efferdAdapter,
} as const;

export type AdapterId = keyof typeof adapters;

export function normalizeWithAdapter(adapterId: AdapterId, input: unknown) {
  return adapters[adapterId].parse(input);
}
