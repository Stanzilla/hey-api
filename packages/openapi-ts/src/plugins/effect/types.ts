import type { DefinePlugin, Plugin } from '@hey-api/shared';

export type EffectFormat = 'httpapi' | 'httpclient' | 'httpclient-type-only';

export type UserConfig = Plugin.Name<'effect'> &
  Plugin.Hooks &
  Plugin.UserExports & {
    /**
     * Output format passed to `@effect/openapi-generator`.
     *
     * - `'httpclient'` - Effect `Schema` types and an `HttpClient` based client
     * - `'httpclient-type-only'` - TypeScript types and an `HttpClient` based client
     * - `'httpapi'` - Effect `Schema` types and an `HttpApi` definition
     *
     * @default 'httpclient'
     */
    format?: EffectFormat;
    /**
     * Name of the generated client or `HttpApi` class.
     *
     * @default 'Client'
     */
    outputName?: string;
  };

export type Config = Plugin.Name<'effect'> &
  Plugin.Hooks &
  Plugin.Exports & {
    /** Output format passed to `@effect/openapi-generator`. */
    format: EffectFormat;
    /** Name of the generated client or `HttpApi` class. */
    outputName: string;
  };

export type EffectPlugin = DefinePlugin<UserConfig, Config>;
