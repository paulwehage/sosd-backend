export const SDLC_STEPS = [
  'integration_deployment',
  'testing',
  'development',
  'design',
  'planning',
  'operations',
] as const;

export type SdlcStepName = (typeof SDLC_STEPS)[number];
