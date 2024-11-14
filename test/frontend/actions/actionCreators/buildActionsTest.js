import { expect } from 'chai';
import {
  buildsFetchStarted,
  buildsFetchStartedType,
  buildsReceived,
  buildRestarted,
  buildRestartedType,
} from '../../../../frontend/actions/actionCreators/buildActions';

describe('buildActions actionCreators', () => {
  describe('builds fetch started', () => {
    it('constructs properly', () => {
      const actual = buildsFetchStarted();
      expect(actual).to.deep.equal({
        type: buildsFetchStartedType,
      });
    });

    it('exports its type', () => {
      expect(buildsFetchStartedType).to.equal('BUILDS_FETCH_STARTED');
    });
  });

  describe('build restarted', () => {
    it('constructs properly', () => {
      const build = {
        a: 'bee',
        see: 'dee',
      };

      const actual = buildRestarted(build);

      expect(actual).to.deep.equal({
        type: buildRestartedType,
        build,
      });
    });

    it('exports its type', () => {
      expect(buildRestartedType).to.equal('BUILD_RESTARTED');
    });
  });
});
