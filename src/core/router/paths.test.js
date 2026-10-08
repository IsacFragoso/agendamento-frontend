import { describe, expect, it } from 'vitest';
import { getDashboardPathForAccountType, ROUTE_PATHS } from './paths';

describe('getDashboardPathForAccountType', () => {
  it('routes clients and providers to their own dashboards', () => {
    expect(getDashboardPathForAccountType('CLIENTE')).toBe('/app/dashboard');
    expect(getDashboardPathForAccountType('PRESTADOR')).toBe('/app/dashboard');
  });

  it('routes unsupported roles to the unavailable-access page', () => {
    expect(getDashboardPathForAccountType('ADMIN')).toBe(ROUTE_PATHS.unsupportedRole);
  });
});