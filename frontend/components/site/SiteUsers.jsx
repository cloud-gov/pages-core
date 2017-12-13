import React from 'react';
import { SITE, USER } from '../../propTypes';
import ButtonLink from '../ButtonLink';
import siteActions from '../../actions/siteActions';

const isSiteOwner = (currentUser, maybeOwner) =>
  maybeOwner.username.toLowerCase() === currentUser.username.toLowerCase();


const SiteUsers = ({ site, user }) => {
  // sort users by lower-cased usernames
  const users = site.users.slice().sort((a, b) => {
    const aName = a.username.toLowerCase();
    const bName = b.username.toLowerCase();
    if (aName === bName) { return 0; }
    if (aName > bName) { return 1; }
    return -1;
  });

  const handleClick = userToRemove => (event) => {
    event.preventDefault();

    siteActions.removeUserFromSite(site.id, userToRemove.id);
  };

  return (
    <div>
      <p>
        This user table is a partially complete feature.
        It allows you to easily audit who else has access
        to Federalist settings and logs for this site, and 
        to remove user access for others. Eventually,
        this table will be used to allow you to add other users.
        Currently, new users get access for a specific site by 
        logging into Federalist and adding the site themselves.
      </p>
      <h4 className="label">Federalist users associated with this site</h4>
      <table className="usa-table-borderless">
        <thead>
          <tr>
            <th>User</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(rowUser =>
            (<tr key={rowUser.username}>
              <td>
                <a
                  href={`https://github.com/${rowUser.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Visit GitHub profile for ${rowUser.username}`}
                >
                  {rowUser.username}
                </a>
                {' '}
                {isSiteOwner(user, rowUser) ? '(you)' : ''}
              </td>
              <td>
                {
                  isSiteOwner(user, rowUser) ? '-' :
                  <ButtonLink clickHandler={handleClick(rowUser)}>
                    Remove user
                  </ButtonLink>
                }
              </td>
            </tr>)
          )}
        </tbody>
      </table>
    </div>
  );
};

SiteUsers.propTypes = {
  site: SITE,
  user: USER,
};

SiteUsers.defaultProps = {
  site: null,
  user: null,
};

export default SiteUsers;
