import page from 'page';
import { notification } from '../stores';
import { deactivateOrganization, activateOrganization } from '../lib/api';

async function deactivate(id, redirectTo) {
  // eslint-disable-next-line no-alert
  if (!window.confirm('Are you sure you want to deactivate this organization?')) { return null; }
  try {
    await deactivateOrganization(id);
    page(redirectTo);
    return notification.setSuccess(`Organization ${id} deactivated successfully!`);
  } catch (error) {
    return notification.setError(`Unable to deactivate organization ${id}: ${error.message}`);
  }
}

async function activate(id, redirectTo) {
  try {
    await activateOrganization(id);
    page(redirectTo);
    return notification.setSuccess(`Organization ${id} activated successfully!`);
  } catch (error) {
    return notification.setError(`Unable to activate organization ${id}: ${error.message}`);
  }
}

export default {
  activate,
  deactivate,
};
