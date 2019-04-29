const ExternalAuthController = {

  callback(req, res) {

    // https://github.com/vencax/netlify-cms-github-oauth-provider/blob/master/index.js
    const content = {
      token: req.user.accessToken,
      provider: 'github'
    };

    const script = `
      <script>
        (function() {
          function receiveMessage(e) {
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify(content)}',
              e.origin
            )
          }
          window.addEventListener("message", receiveMessage, false)
          // Start handshare with parent
          window.opener.postMessage("authorizing:github", "*")
        })()
      </script>
    `;

    res.send(script);
  }
};

module.exports = ExternalAuthController;


