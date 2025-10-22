const { layout, css, centeredButton } = require('./layout');

function uaaIDPInvite({ link, orgName }) {
  return layout(
    `
    <p style="${css.p}">
      You&rsquo;ve been invited to join <b>${orgName}</b> on <a href="https://cloud.gov/pages" style="${css.a}" target="_blank">cloud.gov Pages</a>.
    </p>
    <p style="${css.p}">
      To get started on Pages, log in with your agency credentials at
      <a href="${link}/login" style="${css.a}" target="_blank">${link}/login</a>:
    </p>
    ${centeredButton(`${link}/login`, 'Log in with cloud.gov')}
    <p style="${css.p}">
      We&rsquo;re here to help. If you need support, check out <a href="https://docs.cloud.gov/pages/using-pages/getting-started" style="${css.a}" target="_blank">our Getting Started guide</a> or email us at
      <a href="mailto:pages-support@cloud.gov"
        style="${css.a}" target="_blank">pages-support@cloud.gov.</a>
    </p>
  `,
    `You&rsquo;ve been invited to join ${orgName} on cloud.gov Pages`,
  );
}

module.exports = uaaIDPInvite;
