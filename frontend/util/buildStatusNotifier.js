import io from 'socket.io-client';

import globals from '../globals';

class BuildStatusNotifier {
  constructor() {
    this.listening = false;
    this.io = io;
  }

  connectSocket(permission) {
    if (permission !== 'granted') {
      return false;
    }

    const socket = this.io(globals.APP_HOSTNAME, {
      transports: ['websocket'],
    });

    socket.on('build status', (build) => {
      this.notify(build);
    });
    return true;
  }

  listen() {
    /* eslint no-undef: "error" */
    /* eslint-env browser */
    if (typeof Notification === 'undefined' || this.listening) {
      return Promise.resolve();
    }

    this.listening = true;

    try {
      return Notification.requestPermission().then((permission) =>
        this.connectSocket(permission),
      );
    } catch (error) {
      if (error instanceof TypeError) {
        return Promise.resolve(Notification.requestPermission(this.connectSocket));
      }
      return Promise.reject(error);
    }
  }

  notify(build) {
    let titleStatus;
    switch (build.state) {
      case 'error':
        titleStatus = 'Failed Build: Please review logs.';
        break;
      case 'processing':
        titleStatus = 'Build In-Progress';
        break;
      case 'queued':
        titleStatus = 'Build Queued';
        break;
      case 'success':
        titleStatus = 'Successful Build';
        break;
      default:
        return null;
    }
    const icon = '/images/favicons/favicon.ico';
    const note = new Notification(`${titleStatus}`, {
      body: `Site: ${build.owner}/${build.repository}   Branch: ${build.branch}`,
      icon,
    });
    note.onclick = (event) => {
      event.preventDefault(); // prevent the browser from focusing the Notification's tab
      window.open(`/sites/${build.site}`, '_blank');
    };
    return note;
  }
}

export default BuildStatusNotifier;
