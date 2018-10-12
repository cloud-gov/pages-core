import io from 'socket.io-client';
module.exports = class BuildStatusNotifier {
  static notify() {
    /* eslint no-undef: "error" */
    /* eslint-env browser */

    if(BuildStatusNotifier.listening) {
      return;
    }
    BuildStatusNotifier.listening = true;

    Notification.requestPermission((permission) => {
      // If the user accepts, let's create a notification
      if (permission === 'granted') {
        const socket = io();
        socket.on('build status', (build) => {
          let body;
          let titleStatus;
          switch (build.state) {
            case 'error':
              body = 'A build has failed. Please view the logs for more information.';
              titleStatus = "Failed Build: Please review logs.";
              break;
            case 'processing':
              body = 'A build is in progress';
              titleStatus = "Build In-Progress";
              break;
            default:
              body = 'A build completed successfully.';
              titleStatus = "Successful Build";
              break;
          }
          const icon = '/images/favicons/favicon.ico';
          new Notification(`${titleStatus}`, {body: `Site: ${build.owner}/${build.repository}   Branch: ${build.branch}`, icon });
        });
      }
    });
  }
};