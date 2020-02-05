import io from 'socket.io-client';

module.exports = class BuildStatusNotifier {
  static listen() {
    /* eslint no-undef: "error" */
    /* eslint-env browser */

    if (typeof Notification === 'undefined') {
      return Promise.resolve();
    }

    if (BuildStatusNotifier.listening) {
      return Promise.resolve();
    }

    const connectSocket = (permission) => {
      if (permission === 'granted') {
        const accessToken = (document.querySelectorAll('meta[name="accessToken"]')[0] || {}).content;
        const socketHost = (document.querySelectorAll('meta[name="socketHost"]')[0] || {}).content;
        if (accessToken) {
          const socket = io(socketHost, { transports: ['websocket'], query: { accessToken } });
          socket.on('build status', (build) => {
            this.notify(build);
          });
          return true;
        }
      }
      return false;
    };

    BuildStatusNotifier.listening = true;
    try {
      return Notification.requestPermission()
        .then(permission => connectSocket(permission));
    } catch (error) {
      if (error instanceof TypeError) {
        return Promise.resolve(Notification.requestPermission(connectSocket));
      }
      return Promise.reject(error);
    }
  }

  static notify(build) {
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
    const note = new Notification(`${titleStatus}`, { body: `Site: ${build.owner}/${build.repository}   Branch: ${build.branch}`, icon });
    note.onclick = (event) => {
      event.preventDefault(); // prevent the browser from focusing the Notification's tab
      window.open(`/sites/${build.site}`, '_blank');
    };
    return note;
  }
};
