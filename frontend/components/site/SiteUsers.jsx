import React from 'react';
import { connect } from 'react-redux';
import { SITE, USER } from '../../propTypes';
import ButtonLink from '../ButtonLink';
import siteActions from '../../actions/siteActions';
import UserActionsTable from './UserActionsTable';
import { IconGitHub } from '../icons';

const isSiteOwner = (user, siteOwner) =>
  user.username.toLowerCase() === siteOwner.toLowerCase();

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
    const userToRemoveId = userToRemove.id;

    siteActions.removeUserFromSite(site.id, userToRemoveId, userToRemoveId === user.id)
    .then(() => siteActions.fetchSites());
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
      <table className="usa-table-borderless table-full-width log-table">
        <caption>Federalist users associated with this site</caption>
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
                  className="repo-link"
                  rel="noopener noreferrer"
                  title={`Visit GitHub profile for ${rowUser.username}`}
                >
                  {rowUser.username}
                  {rowUser.username.toLowerCase() === user.username.toLowerCase() ? ' (you)' : ''}
                  <IconGitHub />
                </a>
              </td>
              <td>
                {
                  isSiteOwner(rowUser, site.owner) ? '-' :
                  <ButtonLink clickHandler={handleClick(rowUser)}>
                    Remove user
                  </ButtonLink>
                }
              </td>
            </tr>)
          )}
        </tbody>
      </table>
      <UserActionsTable site={site.id} />
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

const mapStateToProps = ({ user, sites }) => ({
  user: user.data,
  site: sites.currentSite,
});

export { SiteUsers };
export default connect(mapStateToProps)(SiteUsers);
