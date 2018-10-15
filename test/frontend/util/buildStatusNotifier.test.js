import { expect } from 'chai';
import { spy, stub } from "sinon";
import BuildStatusNotifier from '../../../frontend/util/buildStatusNotifier';

describe('listen', () => {
	it('does not throw error by default', (done) => {
		const msg = { state: 'state', owner: 'owner', repository: 'repository', branch: 'branch' };
		const notifySpy = spy(BuildStatusNotifier, 'notify');
		const listenSpy = spy(BuildStatusNotifier, 'listen');
		
		expect(listenSpy.called).to.be.false;
		expect(BuildStatusNotifier.listening).to.be.undefined;
		BuildStatusNotifier.listen();
		expect(BuildStatusNotifier.listening).to.be.true;
		expect(listenSpy.called).to.be.true;

		expect(notifySpy.called).to.be.false;
		BuildStatusNotifier.notify(msg);
		expect(notifySpy.called).to.be.true;
		done();
  });
});
