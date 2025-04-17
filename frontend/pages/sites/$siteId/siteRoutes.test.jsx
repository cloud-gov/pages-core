import React, { isValidElement } from 'react';
import siteRoutes from './siteRoutes';
import '@testing-library/jest-dom';

jest.mock('pretty-bytes', () => ({
  __esModule: true,
  default: jest.fn((bytes) => `${bytes} B`),
}));

describe('siteRoutes', () => {
  const originalEnv = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });
  afterAll(() => {
    process.env = originalEnv;
  });

  describe('feature flags', () => {
    it('should include storage route logs', () => {
      // Enable FEATURE_FILE_STORAGE_SERVICE
      process.env.FEATURE_FILE_STORAGE_SERVICE = 'true';

      const routes = jest.requireActual('./siteRoutes').default;
      expect(routes.some((route) => route.path === 'storage')).toBe(true);
      expect(routes.some((route) => route.path === 'storage/logs')).toBe(true);
    });

    it('should not include storage route logs', () => {
      // Disable FEATURE_FILE_STORAGE_SERVICE
      process.env.FEATURE_FILE_STORAGE_SERVICE = 'false';

      const routes = jest.requireActual('./siteRoutes').default;
      expect(routes.some((route) => route.path === 'storage')).toBe(true);
      expect(routes.some((route) => route.path === 'storage/logs')).toBe(false);
    });
  });

  describe('site routes', () => {
    it('should include the following', () => {
      const routes = jest.requireActual('./siteRoutes').default;
      const paths = [
        'custom-domains',
        'custom-domains/new',
        'custom-domains/:domainId/edit',
        'builds',
        'builds/:buildId/logs',
        'reports',
        'settings',
        'storage',
        'published',
        'published/:name',
      ];

      paths.map((p) => {
        expect(routes.some((route) => route.path === p)).toBe(true);
      });
    });
  });

  describe('each route Component', () => {
    it('should be a renderable React component', () => {
      siteRoutes.forEach((route) => {
        expect(isValidElement(<route.Component />)).toBe(true);
      });
    });

    it('should be a valid function or memoized component', () => {
      siteRoutes.forEach((route) => {
        const component = route.Component;
        expect(
          typeof component === 'function' ||
            component.$$typeof === Symbol.for('react.memo'),
        ).toBe(true);
      });
    });
  });
});
