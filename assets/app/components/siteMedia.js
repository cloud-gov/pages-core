import bel from 'bel';

function html(site) {
  if (!site.assets) return bel`<p>No media here</p>`;

  return bel`<div>
    <ul>
      ${site.assets.map((a) => {
        return bel`${a}`;
      })}
    </ul>
  </div>`;
}

function getCurrentSite(state) {
  return state.sites.filter((site) => {
    return site.id === state.currentView.siteId ;
  }).pop();
}

export default function render (state) {
  let site = getCurrentSite(state);
  return html(site);
}
