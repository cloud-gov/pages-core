import React from 'react';
import { duration, timeFrom } from '../../util/datetime';
import buildActions from '../../actions/buildActions';

const propTypes = {
  site: React.PropTypes.object
};

const getUsername = (site, id) => {
  const user = site.users.find(user => user.id === id);
  return user.username;
};

const restartClicked = (event, build) => {
  event.preventDefault()
  buildActions.restartBuild(build);
}

const restartLink = (build) =>
  <a
    href="#" alt="Restart this build"
    onClick={ (e) => restartClicked(e, build) }
  >
    Restart
  </a>

const sortSiteBuilds = (site) => {
  return site.builds.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
}

const SiteLogs = ({site}) =>
  <table className="usa-table-borderless build-log-table">
    <thead>
      <tr>
        <th scope="col">Branch</th>
        <th scope="col">User</th>
        <th scope="col">Completed</th>
        <th scope="col">Duration</th>
        <th scope="col">Message</th>
        <th scope="col">Actions</th>
      </tr>
    </thead>
    <tbody>
      {sortSiteBuilds(site).map((build) => {
        const rowClass = `usa-alert-${build.state}`;
        const username = getUsername(site, build.user);

        let message;

        switch (build.state) {
          case 'error':
            message = build.error;
            break;
          case 'processing':
            message = 'This build is in progress';
            break;
          default:
            message = 'The build completed successfully.';
            break;
        }

        return (
          <tr key={ build.id } className={ rowClass }>
            <td scope="row">{ build.branch }</td>
            <td>{ username }</td>
            <td>{ timeFrom(build.completedAt) }</td>
            <td>{ duration(build.createdAt, build.completedAt) }</td>
            <td>{ message }</td>
            <td>{ restartLink(build) }</td>
          </tr>
        )
      })}
    </tbody>
  </table>

SiteLogs.defaultProps = {
  builds: []
};

SiteLogs.propTypes = propTypes;

export default SiteLogs;
