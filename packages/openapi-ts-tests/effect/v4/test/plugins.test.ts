import fs from 'node:fs';
import path from 'node:path';

import { make } from '@effect/openapi-generator/OpenApiGenerator';
import { createClient, type UserConfig } from '@hey-api/openapi-ts';
import { Effect } from 'effect';
import { load } from 'js-yaml';

import { getFilePaths, getSpecsPath } from '../../../utils';

const versions = ['2.0.x', '3.0.x', '3.1.x'];

const formats = ['httpclient', 'httpclient-type-only', 'httpapi'] as const;

for (const version of versions) {
  const outputDir = path.join(import.meta.dirname, '..', '.gen', 'snapshots', version);
  const snapshotsDir = path.join(import.meta.dirname, '..', '__snapshots__', version);
  const specPath = path.join(getSpecsPath(), version, 'faker.yaml');

  describe(`OpenAPI ${version} effect`, () => {
    const createConfig = (
      userConfig: Omit<UserConfig, 'input'> & Pick<Required<UserConfig>, 'plugins'>,
    ) =>
      ({
        ...userConfig,
        input: specPath,
        logs: {
          level: 'silent',
        },
        output: path.join(
          outputDir,
          typeof userConfig.output === 'string' ? userConfig.output : '',
        ),
      }) as const satisfies UserConfig;

    const scenarios = [
      ...formats.map((format) => ({
        config: createConfig({
          output: format,
          plugins: [{ format, name: 'effect' }],
        }),
        description: `generate ${format} output with Effect plugin`,
        format,
      })),
      {
        config: createConfig({
          output: 'output-name',
          plugins: [{ name: 'effect', outputName: 'PetStore' }],
        }),
        description: 'generate client with custom name',
        format: undefined,
      },
    ];

    it.each(scenarios)('$description', async ({ config, format }) => {
      await createClient(config);

      const filePaths = getFilePaths(config.output);

      await Promise.all(
        filePaths.map(async (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          await expect(fileContent).toMatchFileSnapshot(
            path.join(snapshotsDir, filePath.slice(outputDir.length + 1)),
          );
        }),
      );

      if (!format) return;

      const spec = load(fs.readFileSync(specPath, 'utf-8')) as any;
      const expected = await Effect.runPromise(
        Effect.flatMap(make, (generator) => generator.generate(spec, { format, name: 'Client' })),
      );
      const actual = fs.readFileSync(path.join(config.output, 'effect.gen.ts'), 'utf-8');
      // drop the file header added by Hey API
      expect(actual.slice(actual.indexOf('\n\n') + 2)).toBe(`${expected.trimEnd()}\n`);
    });
  });
}
