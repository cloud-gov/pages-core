import { navigate } from '@reach/router';

const pushRouterHistory = path => navigate(path);
const replaceRouterHistory = path => navigate(path, { replace: true });

export { pushRouterHistory, replaceRouterHistory };
