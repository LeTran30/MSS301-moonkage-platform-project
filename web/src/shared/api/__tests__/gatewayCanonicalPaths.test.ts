import { describe, it, expect } from 'vitest';
import { GATEWAY, NOT_IMPLEMENTED_YET } from '../gateway';

/**
 * D-30: the public path of a resource is `/api/<resource>/...`, without the name of the service.
 *
 * The test walks the whole path table - including the constants built by a function - and fails on any
 * path that still carries the name of a service. The legacy form is answered with a 308 by the gateway
 * during the migration window, but the web must not depend on that redirect: it has to call the canonical
 * path directly.
 */

/** Every path of a group: the string constants and the strings the builder functions return. */
function pathsOf(value: unknown, sampleId = 'sample-id'): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (typeof value === 'function') {
    // A builder takes the ids of the resources it addresses; a sample id is enough to see its prefix.
    return pathsOf((value as (id: string) => unknown)(sampleId), sampleId);
  }
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((child) =>
      pathsOf(child, sampleId),
    );
  }
  return [];
}

describe('Shared API - canonical paths (D-30)', () => {
  it('không hằng đường dẫn nào chứa tên service', () => {
    const paths = [...pathsOf(GATEWAY), ...pathsOf(NOT_IMPLEMENTED_YET)];

    expect(paths.length).toBeGreaterThan(0);
    expect(paths.filter((path) => path.includes('-service/api/'))).toEqual([]);
  });

  it('mọi đường dẫn HTTP bắt đầu bằng /api', () => {
    // LOGISTICS holds the WebSocket path (/ws), which is not an HTTP endpoint and has no /api prefix.
    const httpGroups = Object.entries(GATEWAY).filter(([group]) => group !== 'LOGISTICS');

    const paths = httpGroups.flatMap(([, group]) => pathsOf(group));

    expect(paths.filter((path) => !path.startsWith('/api'))).toEqual([]);
  });
});
