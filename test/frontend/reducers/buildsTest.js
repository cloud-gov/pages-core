import { expect } from 'chai';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

describe('buildsReducer', () => {
  let fixture;
  const BUILDS_FETCH_STARTED = 'builds fetch started';
  const BUILDS_RECEIVED = 'builds received';
  const BUILD_RESTARTED = 'build restarted';

  beforeEach(() => {
    fixture = proxyquire('../../../frontend/reducers/builds.js', {
      '../actions/actionCreators/buildActions': {
        buildsFetchStartedType: BUILDS_FETCH_STARTED,
        buildsReceivedType: BUILDS_RECEIVED,
        buildRestartedType: BUILD_RESTARTED,
      },
    }).default;
  });

  it('ignores other actions and returns an initial state', () => {
    const BUILDS = ['🛠', '⚒'];

    const actual = fixture(undefined, {
      type: '🙅‍',
      builds: BUILDS,
    });

    expect(actual).to.deep.equal({ isLoading: false, data: {} });
  });

  it('marks the state loading when a fetch is started', () => {
    const actual = fixture({ isLoading: false }, {
      type: BUILDS_FETCH_STARTED,
    });

    expect(actual).to.deep.equal({ isLoading: true });
  });

  it('sets the builds to the ones in the action when the fetch completes', () => {
    const BUILDS = ['🛠', '⚒'];

    const actual = fixture({ isLoading: true }, {
      type: BUILDS_RECEIVED,
      builds: BUILDS,
    });

    expect(actual).to.deep.equal({ isLoading: false, data: BUILDS });
  });

  it('records builds that are restarted', () => {
    const BUILDS = ['🔧', '🔨'];
    const RESTARTED_BUILD = '⛏';

    const actual = fixture({ isLoading: false, data: BUILDS }, {
      type: BUILD_RESTARTED,
      build: RESTARTED_BUILD,
    });

    expect(actual).to.deep.equal({
      isLoading: false,
      data: [RESTARTED_BUILD, ...BUILDS],
    });
  });
});
