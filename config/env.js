module.exports = {
  buildSpaceGuid: process.env.BUILD_SPACE_GUID || '123abc-456def-789ghi',
  cfOauthTokenUrl: process.env.CLOUD_FOUNDRY_OAUTH_TOKEN_URL || 'https://login.example.com/oauth/token',
  cfApiHost: process.env.CLOUD_FOUNDRY_API_HOST || 'https://api.example.com',
};
