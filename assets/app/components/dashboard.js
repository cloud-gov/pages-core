import bel from 'bel';

function html(sites) {
  const template = bel`<div>
    <div class="usa-grid dashboard header">
      <div class="usa-width-two-thirds">
        <img class="header-icon" src="/images/websites.svg" alt="Websites icon">
        <div class="header-title">
          <h1>Your Websites</h1>
          <p>Dashboard</p>
        </div>
      </div>
      <div class="usa-width-one-third">
        <a class="usa-button usa-button-big pull-right icon icon-new icon-white" href="#/new"  alt="Add a new website" role="button">Add Website</a>
      </div>
    </div>

    <div class="usa-grid">
      <h2>Websites</h2>
      <ul class="sites-list">
        ${sites.map((s) => bel`${siteItemHtml(s)}`)}
      </ul>
    </div>

    <div class="usa-grid">
      <div class="usa-width-one-whole" style="text-align: center;">
        <a class="usa-button usa-button-big icon icon-new icon-white" href="#new"  alt="Add a new website" role="button">Add Website</a>
      </div>
    </div>
  </div>`;

  if (sites.length > 0) return template;

  return bel`<div class="usa-grid dashboard--empty">
    <img src="/images/website.svg" alt="Website icon">
    <h1>Welcome to Federalist!</h1>
    <p>It looks like you don't have any websites yet. Add a website and let's get started.</p>
    <a class="usa-button usa-button-big icon icon-new icon-white" href="#new" alt="Add a new website" role="button">Add Website</a>
  </div>`;
}

function siteItemHtml(site) {
  let buildText = 'This site has not been published yet. Please wait while the site is built.';
  let sorted = site.builds.sort((a, b) => a.id > b.id);
  if (site.builds.length) buildText = `This site was last published at ${sorted[0].completedAt}`;

  return bel`<li class="sites-list-item">
    <div class="sites-list-item-text">
      <a href="#site/${site.id}">${site.owner} / ${site.repository}</a>
      <p>${buildText}</p>
    </div>
    <div class="sites-list-item-actions">
      <a class="icon icon-view" href="#" alt="View the ${site.repository} site" target="_blank">Visit Site</a>
    </div>
  </li>`;
}

export default function render (state) {
  return html(state.sites);
}
