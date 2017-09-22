import React from 'react';
import { SITE } from '../../propTypes';


const SiteUsers = ({ site }) => {
  // sort users by lower-cased usernames
  const users = site.users.slice().sort((a, b) => {
    const aName = a.username.toLowerCase();
    const bName = b.username.toLowerCase();
    if (aName === bName) { return 0; }
    if (aName > bName) { return 1; }
    return -1;
  });

  return (
    <div>
      <h4 className="label">Federalist users associated with this site</h4>
      <table className="usa-table-borderless">
        <thead>
          <tr>
            <th>User</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user =>
            (<tr key={user.username}>
              <td>
                <a
                  href={`https://github.com/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Visit GitHub profile for ${user.username}`}
                >
                  {user.username}
                </a>
                {' '}
                {user.username.toLowerCase() === site.owner.toLowerCase() ? '(owner)' : ''}
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
};

SiteUsers.defaultProps = {
  site: null,
};

export default SiteUsers;
