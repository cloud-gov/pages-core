import page from 'page';
import { notification } from '../stores';
import { destroySite } from '../lib/api';

function destroy(site) {
  return async () => {
    try {
      await destroySite(site.id);
      page('/sites');
      return notification.setSuccess(`Site ${site.id}: ${site.repository} deleted successfully!`);
    } catch (error) {
      return notification.setError(`Unable to delete site ${site.id}: ${error.message}`);
    }
  };
}

export default destroy;
