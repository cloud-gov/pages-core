const { layout, css, centeredButton } = require('./layout');

function uaaInvite({ link }) {
  const linkStyle = `
    font-size:18px;
    line-height:26px;
    margin:16px 0;
    background-color:#f5f5f0;
    padding:12px 12px
  `;

  return layout(
    `
    <p style="${css.p}">
      You&rsquo;ve been invited to join your team on <a href="https://cloud.gov/pages" style="${css.a}" target="_blank">cloud.gov Pages</a>.
    </p>
    ${centeredButton(link, 'Accept the invitation')}
    <p style="${css.p}">
      Or, copy the URL below and paste it into your browser&rsquo;s address bar:
    </p>
    <p style="${linkStyle}">
      ${link}
    </p>
    <p style="${css.p}">
      <b>This invitation will expire after 24 hours.</b>
    </p>
    <p style="${css.p}">
      We&rsquo;re here to help. If you need support, check out <a href="https://cloud.gov/pages/documentation/#getting-started" style="${css.a}" target="_blank">our Getting Started guide</a> or email us at
      <a href="mailto:pages-support@cloud.gov"
        style="${css.a}" target="_blank">pages-support@cloud.gov.</a>
    </p>
  `,
    'You&rsquo;ve been invited to join cloud.gov Pages',
  );
}

module.exports = uaaInvite;
