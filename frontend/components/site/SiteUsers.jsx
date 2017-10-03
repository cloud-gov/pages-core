import React from 'react';
import { SITE, USER } from '../../propTypes';


const SiteUsers = ({ site, user }) => {
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
      <p>
        This user table is a partially complete feature.
        It allows you to easily audit who else has access 
        to Federalist settings and logs for this site. Eventually, 
        this table will be used to allow you to add and remove other users. 
        New users get access for a specific site by logging into Federalist
        and adding the site themselves.
      </p>
      <h4 className="label">Federalist users associated with this site</h4>
      <table className="usa-table-borderless">
        <thead>
          <tr>
            <th>User</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u =>
            (<tr key={u.username}>
              <td>
                <a
                  href={`https://github.com/${u.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Visit GitHub profile for ${u.username}`}
                >
                  {u.username}
                </a>
                {' '}
                {u.username.toLowerCase() === user.username.toLowerCase() ? '(you)' : ''}
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
