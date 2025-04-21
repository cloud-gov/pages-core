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
    it('should include Reports', () => {
      const routes = jest.requireActual('./siteRoutes').default;
      expect(routes.some((route) => route.path === 'reports')).toBe(true);
    });

    it('should include storage routes', () => {
      const routes = jest.requireActual('./siteRoutes').default;
      expect(routes.some((route) => route.path === 'storage')).toBe(true);
      expect(routes.some((route) => route.path === 'storage/logs')).toBe(true);
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
