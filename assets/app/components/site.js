import bel from 'bel';

import siteActions from '../actions/siteActions';

function getCurrentSite(state, siteId) {
  return state.sites.filter((s) => {
    return s.id === siteId;
  }).pop();
}

function html(state) {
  let site = getCurrentSite(state, state.currentView.siteId);

  const onclick = (e) => {
    siteActions.fetchSiteAssets(site);
  }

  if (!site) return bel`<p>Nothing here</p>`;

  return bel`<div>
    <div class="usa-grid site">
      <div class="usa-width-one-sixth" id="fool">
        <ul class="site-actions">
          <li>
            <a class="icon icon-pages" href="/#site/${site.id}/">Pages</a>
          </li>
          <li>
            <a class="icon icon-media" href="/#site/${site.id}/media">Media</a>
          </li>
          <li>
            <a class="icon icon-settings" href="/#site/${site.id}/settings">Settings</a>
          </li>
          <li>
            <a class="icon icon-logs" href="/#site/${site.id}/logs">Logs</a>
          </li>
        </ul>
      </div>
      <div class="usa-width-five-sixths site-main" id="pages-container">

      </div>
    </div>
  </div>`;
}

export default function render (state) {
  return html(state);
}
