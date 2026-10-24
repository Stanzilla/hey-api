import type { OpenAPIV2 } from '@hey-api/spec-types';

import type { Context } from '../../../ir/context';
import { buildResourceMetadata } from '../../../openApi/shared/graph/meta';
import { transformOpenApiSpec } from '../../../openApi/shared/transforms';
import type { State } from '../../../openApi/shared/types/state';
import {
  createFilteredDependencies,
  createFilters,
  hasFilters,
} from '../../../openApi/shared/utils/filter';
import { buildGraph } from '../../../openApi/shared/utils/graph';
import { mergeParametersObjects } from '../../../openApi/shared/utils/parameter';
import { computeAmbiguousSecurityKeys } from '../../../openApi/shared/utils/security';
import { handleValidatorResult } from '../../../openApi/shared/utils/validator';
import { pathToJsonPointer } from '../../../utils/ref';
import { filterSpec } from './filter';
import { parsePathOperation } from './operation';
import { parametersArrayToObject } from './parameter';
import { parseSchema } from './schema';
import { parseServers } from './server';
import { validateOpenApiSpec } from './validate';

type PathKeys<T extends keyof OpenAPIV2.PathsObject = keyof OpenAPIV2.PathsObject> =
  keyof T extends infer K ? (K extends `/${string}` ? K : never) : never;

export function parseV2_0_X(context: Context<OpenAPIV2.Document>): void {
  if (context.config.parser.validate_EXPERIMENTAL) {
    const result = validateOpenApiSpec(context.spec, context.logger);
    handleValidatorResult({ context, result });
  }

  const shouldFilterSpec = hasFilters(context.config.parser.filters);
  if (shouldFilterSpec) {
    const filters = createFilters(context.config.parser.filters, context.spec, context.logger);
    const { graph } = buildGraph(context.spec, context.logger);
    const { resourceMetadata } = buildResourceMetadata(graph, context.logger);
    const sets = createFilteredDependencies({
      filters,
      logger: context.logger,
      resourceMetadata,
    });
    filterSpec({
      ...sets,
      logger: context.logger,
      preserveOrder: filters.preserveOrder,
      spec: context.spec,
    });
  }

  transformOpenApiSpec({ context });

  const state: State = {
    ids: new Map(),
  };
  const securitySchemesMap = new Map<string, OpenAPIV2.SecuritySchemeObject>();

  for (const name in context.spec.securityDefinitions) {
    const securitySchemeObject = context.spec.securityDefinitions[name]!;
    securitySchemesMap.set(name, securitySchemeObject);
  }

  const ambiguousSecurityKeys = computeAmbiguousSecurityKeys(securitySchemesMap);

  if (context.spec.definitions) {
    for (const name in context.spec.definitions) {
      const $ref = pathToJsonPointer(['definitions', name]);
      const schema = context.spec.definitions[name]!;

      parseSchema({
        $ref,
        context,
        schema,
      });
    }
  }

  parseServers({ context });

  for (const path in context.spec.paths) {
    if (path.startsWith('x-')) continue;
    const pathItem = context.spec.paths[path as PathKeys]!;

    const finalPathItem = pathItem.$ref
      ? {
          ...context.resolveRef<OpenAPIV2.PathItemObject>(pathItem.$ref),
          ...pathItem,
        }
      : pathItem;

    const commonOperation: OpenAPIV2.OperationObject = {
      consumes: context.spec.consumes,
      produces: context.spec.produces,
      responses: {},
      security: context.spec.security,
    };
    const operationArgs: Omit<Parameters<typeof parsePathOperation>[0], 'method'> = {
      ambiguousSecurityKeys,
      context,
      operation: {
        ...commonOperation,
        parameters: parametersArrayToObject({
          context,
          operation: commonOperation,
          parameters: finalPathItem.parameters,
        }),
      },
      path: path as PathKeys,
      securitySchemesMap,
      state,
    };

    if (finalPathItem.delete) {
      // copy, so body parameters are not written back to the input spec
      const operation = { ...finalPathItem.delete };
      const parameters = mergeParametersObjects({
        source: parametersArrayToObject({
          context,
          operation,
          parameters: operation.parameters,
        }),
        target: operationArgs.operation.parameters,
      });
      parsePathOperation({
        ...operationArgs,
        method: 'delete',
        operation: {
          ...operationArgs.operation,
          ...operation,
          parameters,
        },
      });
    }

    if (finalPathItem.get) {
      // copy, so body parameters are not written back to the input spec
      const operation = { ...finalPathItem.get };
      const parameters = mergeParametersObjects({
        source: parametersArrayToObject({
          context,
          operation,
          parameters: operation.parameters,
        }),
        target: operationArgs.operation.parameters,
      });
      parsePathOperation({
        ...operationArgs,
        method: 'get',
        operation: {
          ...operationArgs.operation,
          ...operation,
          parameters,
        },
      });
    }

    if (finalPathItem.head) {
      // copy, so body parameters are not written back to the input spec
      const operation = { ...finalPathItem.head };
      const parameters = mergeParametersObjects({
        source: parametersArrayToObject({
          context,
          operation,
          parameters: operation.parameters,
        }),
        target: operationArgs.operation.parameters,
      });
      parsePathOperation({
        ...operationArgs,
        method: 'head',
        operation: {
          ...operationArgs.operation,
          ...operation,
          parameters,
        },
      });
    }

    if (finalPathItem.options) {
      // copy, so body parameters are not written back to the input spec
      const operation = { ...finalPathItem.options };
      const parameters = mergeParametersObjects({
        source: parametersArrayToObject({
          context,
          operation,
          parameters: operation.parameters,
        }),
        target: operationArgs.operation.parameters,
      });
      parsePathOperation({
        ...operationArgs,
        method: 'options',
        operation: {
          ...operationArgs.operation,
          ...operation,
          parameters,
        },
      });
    }

    if (finalPathItem.patch) {
      // copy, so body parameters are not written back to the input spec
      const operation = { ...finalPathItem.patch };
      const parameters = mergeParametersObjects({
        source: parametersArrayToObject({
          context,
          operation,
          parameters: operation.parameters,
        }),
        target: operationArgs.operation.parameters,
      });
      parsePathOperation({
        ...operationArgs,
        method: 'patch',
        operation: {
          ...operationArgs.operation,
          ...operation,
          parameters,
        },
      });
    }

    if (finalPathItem.post) {
      // copy, so body parameters are not written back to the input spec
      const operation = { ...finalPathItem.post };
      const parameters = mergeParametersObjects({
        source: parametersArrayToObject({
          context,
          operation,
          parameters: operation.parameters,
        }),
        target: operationArgs.operation.parameters,
      });
      parsePathOperation({
        ...operationArgs,
        method: 'post',
        operation: {
          ...operationArgs.operation,
          ...operation,
          parameters,
        },
      });
    }

    if (finalPathItem.put) {
      // copy, so body parameters are not written back to the input spec
      const operation = { ...finalPathItem.put };
      const parameters = mergeParametersObjects({
        source: parametersArrayToObject({
          context,
          operation,
          parameters: operation.parameters,
        }),
        target: operationArgs.operation.parameters,
      });
      parsePathOperation({
        ...operationArgs,
        method: 'put',
        operation: {
          ...operationArgs.operation,
          ...operation,
          parameters,
        },
      });
    }
  }
}
