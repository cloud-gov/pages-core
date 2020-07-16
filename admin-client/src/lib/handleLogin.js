// const url = `https://github.com/login?client_id=22067769f7b5b0ca377f&return_to=%2Flogin%2Foauth%2Fauthorize%3Fclient_id%3D22067769f7b5b0ca377f%26redirect_uri%3Dhttps%253A%252F%252Ffederalistapp.18f.gov%252Fexternal%252Fauth%252Fgithub%252Fcallback%26response_type%3Dcode%26scope%3Duser%252Crepo`;

const buildAuthURL = ({ clientId, redirectBaseUrl } = {}) => {
  const githubUrl = "https://github.com/login";
  const redirectPath = "/external/auth/github/callback";
  const redirectUri = `${redirectBaseUrl}${redirectPath}`;
  const returnTo =
    "/login/oauth/authorize?" +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    "response_type=code&" +
    "scope=user";

  const authURL = new URL(githubUrl);

  authURL.searchParams.set("client_id", clientId);
  authURL.searchParams.set("return_to", returnTo);

  return authURL.toString();
};

const calcWindow = () => ({
  width: 600,
  height: 600,
  left: window.screen.width / 2 - 600 / 2,
  top: window.screen.height / 2 - 600 / 2,
});

const authorizeCallback = (authWindow, redirectBaseUrl, callback) => {
  const fn = (e) => {
    if (e.origin !== redirectBaseUrl) {
      authWindow.close();
      callback(new Error("Origin does not match redirect URL"));
    }

    if (e.data.indexOf("authorization:github:success:") === 0) {
      const data = JSON.parse(
        e.data.match(new RegExp("^authorization:github:success:(.+)$"))[1]
      );
      window.removeEventListener("message", fn, false);
      authWindow.close();
      callback(null, data);
    }

    if (e.data.indexOf("authorization:github:error:") === 0) {
      const err = JSON.parse(
        e.data.match(new RegExp("^authorization:github:error:(.+)$"))[1]
      );
      window.removeEventListener("message", fn, false);
      authWindow.close();
      callback(err);
    }
  };
  return fn;
};

const handshakeCallback = (authWindow, redirectBaseUrl, callback) => {
  const fn = (e) => {
    if (e.data === "authorizing:github" && e.origin === redirectBaseUrl) {
      window.removeEventListener("message", fn, false);
      window.addEventListener(
        "message",
        authorizeCallback(authWindow, redirectBaseUrl, callback),
        false
      );
      return authWindow.postMessage(e.data, e.origin);
    }
  };
  return fn;
};

export const handleLogin = ({
  clientId = "22067769f7b5b0ca377f",
  redirectBaseUrl = "http://localhost:1337",
} = {}) => {
  return (callback) => {
    const { width, height, top, left } = calcWindow();
    const authURL = buildAuthURL({
      clientId,
      redirectBaseUrl,
    });

    const authWindow = window.open(
      authURL,
      "Federalist Admin Auth",
      `width=${width}, height=${height}, top=${top}, left=${left}`
    );

    window.addEventListener(
      "message",
      handshakeCallback(authWindow, redirectBaseUrl, callback),
      false
    );
    authWindow.focus();
  };
};
