import type { OpenApiGeneratorWarning } from '@effect/openapi-generator/OpenApiGenerator';
import type { NodeName } from '@hey-api/codegen-core';

import { ts } from '../../ts-compiler';
import { TsDsl } from '../../ts-dsl';
import type { EffectPlugin } from './types';

/**
 * Holds source code produced by `@effect/openapi-generator`. The source is
 * printed as-is, so the output matches the official generator.
 */
class EffectSourceTsDsl extends TsDsl<ts.Identifier> {
  readonly '~dsl' = 'EffectSourceTsDsl';

  constructor(
    name: NodeName,
    private readonly source: string,
  ) {
    super();
    this.name.set(name);
  }

  override toAst() {
    return ts.factory.createIdentifier(this.source.trimEnd());
  }
}

/**
 * Formats a warning the same way as the `openapigen` CLI.
 */
function formatWarning(warning: OpenApiGeneratorWarning): string {
  const context = [
    warning.method?.toUpperCase(),
    warning.path,
    warning.operationId ? `(${warning.operationId})` : undefined,
  ].filter((value): value is string => value !== undefined);
  return context.length
    ? `WARNING [${warning.code}] ${context.join(' ')}: ${warning.message}`
    : `WARNING [${warning.code}] ${warning.message}`;
}

async function loadGenerator() {
  try {
    const [{ Effect }, OpenApiGenerator] = await Promise.all([
      import('effect'),
      import('@effect/openapi-generator/OpenApiGenerator'),
    ]);
    return { Effect, OpenApiGenerator };
  } catch (error) {
    throw new Error(
      'The `effect` plugin requires the `effect` and `@effect/openapi-generator` packages. Install them with `npm install effect @effect/openapi-generator`.',
      { cause: error },
    );
  }
}

export const handler: EffectPlugin['Handler'] = async ({ plugin }) => {
  const { Effect, OpenApiGenerator } = await loadGenerator();

  const warnings: Array<string> = [];
  const source = await Effect.runPromise(
    Effect.flatMap(OpenApiGenerator.make, (generator) =>
      // copy without shared references, swagger2openapi rejects them as YAML anchors
      generator.generate(JSON.parse(JSON.stringify(plugin.context.spec)), {
        format: plugin.config.format,
        name: plugin.config.outputName,
        onWarning: (warning) => {
          warnings.push(formatWarning(warning));
        },
      }),
    ),
  );

  const logLevel = plugin.context.config.logs.level;
  if (logLevel !== 'silent' && logLevel !== 'error' && logLevel !== 'fatal') {
    for (const warning of warnings) {
      console.warn(`❗️ [effect] ${warning}`);
    }
  }

  const symbol = plugin.symbol(plugin.config.outputName, {
    exported: true,
    kind: plugin.config.format === 'httpapi' ? 'class' : 'interface',
    meta: {
      category: 'client',
    },
  });
  plugin.node(new EffectSourceTsDsl(symbol, source));
};
