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
    it('should include Reports when FEATURE_BUILD_TASKS is true', () => {
      process.env.FEATURE_BUILD_TASKS = 'true';
      const routes = jest.requireActual('./siteRoutes').default;
      expect(routes.some((route) => route.path === 'reports')).toBe(true);
    });

    it('should not include Reports when FEATURE_BUILD_TASKS is false', () => {
      process.env.FEATURE_BUILD_TASKS = 'false';
      const routes = jest.requireActual('./siteRoutes').default;
      expect(routes.some((route) => route.path === 'reports')).toBe(false);
    });

    it('should include storage routes when FEATURE_FILE_STORAGE_SERVICE is true', () => {
      process.env.FEATURE_FILE_STORAGE_SERVICE = 'true';
      const routes = jest.requireActual('./siteRoutes').default;
      expect(routes.some((route) => route.path === 'storage')).toBe(true);
      expect(routes.some((route) => route.path === 'storage/logs')).toBe(true);
    });

    // eslint-disable-next-line max-len
    it('should not include storage routes when FEATURE_FILE_STORAGE_SERVICE is false', () => {
      process.env.FEATURE_FILE_STORAGE_SERVICE = 'false';
      const routes = jest.requireActual('./siteRoutes').default;
      expect(routes.some((route) => route.path === 'storage')).toBe(false);
      expect(routes.some((route) => route.path === 'storage/logs')).toBe(false);
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
