import { definePluginConfig } from '@hey-api/shared';

import { handler } from './plugin';
import type { EffectPlugin } from './types';

export const defaultConfig: EffectPlugin['Config'] = {
  config: {
    format: 'httpclient',
    includeInEntry: false,
    outputName: 'Client',
  },
  handler,
  name: 'effect',
  symbolMeta() {
    return {
      artifact: 'effect',
    };
  },
};

/**
 * Type helper for `effect` plugin, returns {@link Plugin.Config} object
 */
export const defineConfig = definePluginConfig(defaultConfig);
