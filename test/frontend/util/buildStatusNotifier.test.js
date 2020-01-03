import { expect } from 'chai';
import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';

const ioMock = stub();

const BuildStatusNotifier = proxyquire('../../../frontend/util/buildStatusNotifier', {
  'socket.io-client': ioMock,
});

describe('buildStatusNotifier', () => {
  before(() => spy(BuildStatusNotifier, 'notify'));

  context('listen', () => {
    let socketIOEventSubscriptions;
    let onMock;
    beforeEach(() => {
      BuildStatusNotifier.notify.reset();

      // Mock out socket.on calls to register event callbacks in the socketIOEventSubscriptions hash
      socketIOEventSubscriptions = {};
      onMock = (message, cb) => {
        socketIOEventSubscriptions[message] = cb;
      };

      ioMock.reset();
      ioMock.returns({ on: onMock });
    });

    afterEach(() => {
      BuildStatusNotifier.listening = undefined;
    });

    context('when notification permissions are granted', () => {
      it('adds a socket io listener that forward to BuildStatusNotifier.notify', (done) => {
        BuildStatusNotifier.listen().then(() => {
          expect(ioMock.called).to.eq(true);
          expect(socketIOEventSubscriptions['build status']).to.be.a('Function');
          expect(BuildStatusNotifier.notify.called).to.eq(false);

          // Call the build status event that listen registered
          const build = { asdf: 1234 };
          socketIOEventSubscriptions['build status'].call(BuildStatusNotifier, build);

          expect(BuildStatusNotifier.notify.called).to.eq(true);
          expect(BuildStatusNotifier.notify.firstCall.args[0]).to.eq(build);
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
  });

  context('notify', () => {
    let msg;
    let options;
    let pushNote;
    const icon = '/images/favicons/favicon.ico';
    beforeEach(() => {
      msg = { state: 'state', owner: 'owner', repository: 'repository', branch: 'branch' };
      options = { body: `Site: ${msg.owner}/${msg.repository}   Branch: ${msg.branch}`, icon };
      BuildStatusNotifier.notify.reset();
    });

    it('build state is neither queued, success nor error', (done) => {
      msg.state = 'other';
      expect(BuildStatusNotifier.notify.called).to.be.false;
      pushNote = BuildStatusNotifier.notify(msg);
      expect(BuildStatusNotifier.notify.calledOnce).to.be.true;
      expect(pushNote).to.be.null;
      done();
    });

    it('build is queued', (done) => {
      msg.state = 'queued';
      expect(BuildStatusNotifier.notify.called).to.be.false;
      pushNote = BuildStatusNotifier.notify(msg);
      expect(BuildStatusNotifier.notify.calledOnce).to.be.true;
      expect(pushNote.title).to.eql('Build Queued');
      expect(pushNote.options).to.deep.eql(options);
      done();
    });

    it('build is successful', (done) => {
      msg.state = 'success';
      expect(BuildStatusNotifier.notify.called).to.be.false;
      pushNote = BuildStatusNotifier.notify(msg);
      expect(BuildStatusNotifier.notify.calledOnce).to.be.true;
      expect(pushNote.title).to.eql('Successful Build');
      expect(pushNote.options).to.deep.eql(options);
      done();
    });

    it('build is errored', (done) => {
      msg.state = 'error';
      expect(BuildStatusNotifier.notify.called).to.be.false;
      pushNote = BuildStatusNotifier.notify(msg);
      expect(BuildStatusNotifier.notify.calledOnce).to.be.true;
      expect(pushNote.title).to.eql('Failed Build: Please review logs.');
      done();
    });

    it('build is processing', (done) => {
      msg.state = 'processing';
      expect(BuildStatusNotifier.notify.called).to.be.false;
      pushNote = BuildStatusNotifier.notify(msg);
      expect(BuildStatusNotifier.notify.calledOnce).to.be.true;
      expect(pushNote.title).to.eql('Build In-Progress');
      done();
    });
  });
});
