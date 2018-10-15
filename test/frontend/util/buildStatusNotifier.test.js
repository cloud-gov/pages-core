import { expect } from 'chai';
import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';

const ioMock = stub();

const BuildStatusNotifier = proxyquire('../../../frontend/util/buildStatusNotifier', {
  'socket.io-client': ioMock,
});


describe('listen', () => {
  let socketIOEventSubscriptions;
  let onMock;

  beforeEach(() => {
    spy(BuildStatusNotifier, 'notify');

    // Mock out socket.on calls to register event callbacks in the socketIOEventSubscriptions hash
    socketIOEventSubscriptions = {};
    onMock = (message, cb) => {
      socketIOEventSubscriptions[message] = cb;
    };

    ioMock.reset();
    ioMock.returns({ on: onMock });
  });

  afterEach(() => {
    BuildStatusNotifier.notify.restore();
    BuildStatusNotifier.listening = undefined;
  });

  context('when notification permissions are granted', (done) => {
    it('adds a socket io listener that forward to BuildStatusNotifier.notify', () => {
      BuildStatusNotifier.listen().then(() => {
        expect(ioMock.called).to.eq(true);
        expect(socketIOEventSubscriptions['build status']).to.be.a('Function');
        expect(BuildStatusNotifier.notify.called).to.eq(false);

        // Call the build status event that listen registered
        const build = { asdf: 1234 };
        socketIOEventSubscriptions['build status'].call(BuildStatusNotifier, build);

        expect(BuildStatusNotifier.notify.called).to.eq(true);
        expect(BuildStatusNotifier.notify.firstCall.args).to.eq(build);
        done();
      }).catch(done);
    });
  });

  context('when notification permissions are denied', () => {
    before(() => {
      global.Notification.permission = 'denied';
    });

    after(() => {
      global.Notification.permission = 'granted';
    });

    it('does not add a socket io listener', (done) => {
      BuildStatusNotifier.listen().then(() => {
        expect(ioMock.called).to.eq(false);
        expect(socketIOEventSubscriptions).to.deep.equal({});
        done();
      }).catch(done);
    });
  });

  context('when the build status has been set', () => {
    before(() => {
      BuildStatusNotifier.listening = true;
    });

    after(() => {
      BuildStatusNotifier.listening = undefined;
    });

    it('does not add a socket io listener', (done) => {
      BuildStatusNotifier.listen().then(() => {
        expect(ioMock.called).to.eq(false);
        expect(socketIOEventSubscriptions).to.deep.equal({});
        done();
      }).catch(done);
    });
  });

  // it('does not throw error by default', (done) => {
  //   const msg = { state: 'state', owner: 'owner', repository: 'repository', branch: 'branch' };
  //   const notifySpy = spy(BuildStatusNotifier, 'notify');
  //   const listenSpy = spy(BuildStatusNotifier, 'listen');
  //
  //   expect(listenSpy.called).to.be.false;
  //   expect(BuildStatusNotifier.listening).to.be.undefined;
  //   BuildStatusNotifier.listen();
  //   expect(BuildStatusNotifier.listening).to.be.true;
  //   expect(listenSpy.calledOnce).to.be.true;
  //   BuildStatusNotifier.listen();
  //   expect(listenSpy.calledTwice).to.be.true;
  //
  //   expect(notifySpy.called).to.be.false;
  //   BuildStatusNotifier.notify(msg);
  //   expect(notifySpy.calledOnce).to.be.true;
  //   msg.state = 'error';
  //   BuildStatusNotifier.notify(msg);
  //   expect(notifySpy.calledTwice).to.be.true;
  //   msg.state = 'processing';
  //   BuildStatusNotifier.notify(msg);
  //   expect(notifySpy.calledThrice).to.be.true;
  //   done();
  // });
});
