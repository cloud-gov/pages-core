import { redirect } from 'react-router-dom';

const pushRouterHistory = path => redirect(path);
const replaceRouterHistory = path => redirect(path, { replace: true });

export { pushRouterHistory, replaceRouterHistory };
