module.exports = {
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/rtl-test/__mocks__/fileMock.js',
    '\\.(css|less)$': '<rootDir>/rtl-test/__mocks__/styleMock.js',
    '@shared(.*)$': '<rootDir>/frontend/shared$1',
    '@pages(.*)$': '<rootDir>/frontend/pages$1',
    '@globals(.*)$': '<rootDir>/frontend/globals$1',
    '@propTypes(.*)$': '<rootDir>/frontend/propTypes$1',
    '@hooks(.*)$': '<rootDir>/frontend/hooks$1',
    '@actions(.*)$': '<rootDir>/frontend/actions$1',
    '@selectors(.*)$': '<rootDir>/frontend/selectors$1',
    '@util(.*)$': '<rootDir>/frontend/util$1',
    '@support(.*)$': '<rootDir>/frontend/support$1',
  },
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/rtl-test/setupJest.js'],
};
