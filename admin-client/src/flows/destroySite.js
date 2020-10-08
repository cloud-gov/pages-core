import page from 'page';
import { notification } from '../stores';
import { destroySite } from '../lib/api';

function destroy(id) {
  return async () => {
    try {
      const result = await destroySite(id);
      page('/sites');
      return notification.setSuccess(`Site ${result.id}: ${result.repository} deleted successfully!`);
    } catch (error) {
      return notification.setError(`Unable to delete site ${id}: ${error.message}`);
    }
  };
}

export default destroy;
