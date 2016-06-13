import bel from 'bel';

function html(site) {
  if (!site.builds) return bel`<p>Nothing here</p>`;

  return bel`<div>
    <div class="usa-grid header">
      <div class="usa-width-two-thirds">
        <img class="header-icon" src="/images/website.svg" alt="Websites icon">
        <div class="header-title">
          <h1>${site.repository}</h1>
          <p>Logs</p>
        </div>
      </div>
      <div class="usa-width-one-third">
        <a class="usa-button usa-button-big pull-right icon icon-view icon-white"
            href="/site/<%- site.owner %>/<%- site.repository %>/"
            alt="View this website" role="button" target="_blank">View Website</a>
      </div>
    </div>
    <div class="usa-grid">
      <table class="usa-table-borderless build-log-table">
        <thead>
          <tr>
            <th scope="col">Branch</th>
            <th scope="col">User</th>
            <th scope="col">Completed</th>
            <th scope="col">Duration</th>
            <th scope="col">Message</th>
          </tr>
        </thead>
        <tbody>
          ${site.builds.map((build) => buildItemHtml(build))}
        </tbody>
      </table>
    </div>
  </div>`;
}


function buildItemHtml(build) {
  let message = 'This build completed successfully.';

  if (build.state === 'error') message = build.error;
  else if (build.state === 'processing') message = 'This build is in progress.';

  return bel`<tr class="usa-alert-${build.state}">
      <td scope="row">${build.branch}</td>
      <td>${build.username}</td>
      <td title="${build.completedAt}">${build.completedAtFormatted}</td>
      <td title="${build.duration}"> ${build.duration} second</td>
      <td>${message}</td>
    </tr>`;
}

function getCurrentSite(state) {
  return state.sites.filter((site) => {
    return site.id === state.currentView.siteId ;
  }).pop();
}

export default function render (state) {
  let site = getCurrentSite(state);
  if (!site || site.builds.length === 0) return html(false);
  return html(site);
}
