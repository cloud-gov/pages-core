import { expect } from 'chai';
import sinon from 'sinon';
import BuildStatusNotifier from '../../../frontend/util/buildStatusNotifier';

describe('buildStatusNotifier', () => {
  let buildStatusNotifier;
  let ioMock;
  beforeEach(() => {
    buildStatusNotifier = new BuildStatusNotifier();
    ioMock = sinon.stub(buildStatusNotifier, 'io');
    sinon.spy(buildStatusNotifier, 'notify');
  });
  afterEach(() => {
    sinon.restore();
  });

  context('listen', () => {
    let socketIOEventSubscriptions;
    let onMock;
    beforeEach(() => {
      // Mock out socket.on calls to register event callbacks in the socketIOEventSubscriptions hash
      socketIOEventSubscriptions = {};
      onMock = (message, cb) => {
        socketIOEventSubscriptions[message] = cb;
      };

      ioMock.returns({
        on: onMock,
      });
    });

    context('when notification permissions are granted', () => {
      it('adds a socket io listener that forward to BuildStatusNotifier.notify', (done) => {
        buildStatusNotifier
          .listen()
          .then(() => {
            expect(ioMock.called).to.eq(true);
            expect(socketIOEventSubscriptions['build status']).to.be.a('Function');
            expect(buildStatusNotifier.notify.called).to.eq(false);

            // Call the build status event that listen registered
            const build = {
              asdf: 1234,
            };
            socketIOEventSubscriptions['build status'].call(buildStatusNotifier, build);

            expect(buildStatusNotifier.notify.called).to.eq(true);
            expect(buildStatusNotifier.notify.firstCall.args[0]).to.eq(build);
            done();
          })
          .catch(done);
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
        buildStatusNotifier
          .listen()
          .then(() => {
            expect(ioMock.called).to.eq(false);
            expect(socketIOEventSubscriptions).to.deep.equal({});
            done();
          })
          .catch(done);
      });
    });

    context('when the build status has been set', () => {
      beforeEach(() => {
        buildStatusNotifier.listening = true;
      });

      it('does not add a socket io listener', (done) => {
        buildStatusNotifier
          .listen()
          .then(() => {
            expect(ioMock.called).to.eq(false);
            expect(socketIOEventSubscriptions).to.deep.equal({});
            done();
          })
          .catch(done);
      });
    });
  });

  context('notify', () => {
    let msg;
    let options;
    let pushNote;
    const icon = '/images/favicons/favicon.ico';
    beforeEach(() => {
      msg = {
        state: 'state',
        owner: 'owner',
        repository: 'repository',
        branch: 'branch',
      };
      options = {
        body: `Site: ${msg.owner}/${msg.repository}   Branch: ${msg.branch}`,
        icon,
      };
    });

    it('build state is neither queued, success nor error', (done) => {
      msg.state = 'other';
      expect(buildStatusNotifier.notify.called).to.be.false;
      pushNote = buildStatusNotifier.notify(msg);
      expect(buildStatusNotifier.notify.calledOnce).to.be.true;
      expect(pushNote).to.be.null;
      done();
    });

    it('build is queued', (done) => {
      msg.state = 'queued';
      expect(buildStatusNotifier.notify.called).to.be.false;
      pushNote = buildStatusNotifier.notify(msg);
      expect(buildStatusNotifier.notify.calledOnce).to.be.true;
      expect(pushNote.title).to.eql('Build Queued');
      expect(pushNote.options).to.deep.eql(options);
      done();
    });

    it('build is successful', (done) => {
      msg.state = 'success';
      expect(buildStatusNotifier.notify.called).to.be.false;
      pushNote = buildStatusNotifier.notify(msg);
      expect(buildStatusNotifier.notify.calledOnce).to.be.true;
      expect(pushNote.title).to.eql('Successful Build');
      expect(pushNote.options).to.deep.eql(options);
      done();
    });

    it('build is errored', (done) => {
      msg.state = 'error';
      expect(buildStatusNotifier.notify.called).to.be.false;
      pushNote = buildStatusNotifier.notify(msg);
      expect(buildStatusNotifier.notify.calledOnce).to.be.true;
      expect(pushNote.title).to.eql('Failed Build: Please review logs.');
      done();
    });

    it('build is processing', (done) => {
      msg.state = 'processing';
      expect(buildStatusNotifier.notify.called).to.be.false;
      pushNote = buildStatusNotifier.notify(msg);
      expect(buildStatusNotifier.notify.calledOnce).to.be.true;
      expect(pushNote.title).to.eql('Build In-Progress');
      done();
    });
  });
});
