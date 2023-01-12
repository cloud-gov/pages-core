// TODO: fix this
import { navigate } from 'react-router-dom';

const pushRouterHistory = path => navigate(path);
const replaceRouterHistory = path => navigate(path, { replace: true });

export { pushRouterHistory, replaceRouterHistory };
