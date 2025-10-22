const { layout, css } = require('./layout');

function sandboxReminder({ organizationId, dateStr, sites, hostname, organizationName }) {
  const organizationLink = `${hostname}/organizations/${organizationId}`;
  const sitesList = sites
    .map(
      (s) =>
        `<li style="${css.p}">
          <a style="${css.a}" target="_blank" href="${hostname}/sites/${s.id}/builds">
            ${s.owner}/${s.repository}
          </a>
        </li>`,
    )
    .join('\n');
  return layout(
    `
    <p style="${css.p}">
      Your 90 days are nearly up!
      The contents of your free sandbox organization
      <a href="${organizationLink}" style="${css.a}" target="_blank">
        ${organizationName}
      </a>
      will be deleted on ${dateStr}.
      This includes all of your previews, build logs, and
      site settings for the following sites:
    </p>
    <ul>
      ${sitesList}
    </ul>
    <p style="${css.p}">
      While your Pages sandbox will be emptied on this date,
      your GitHub code repositories will remain unchanged.
    </p>
    <p style="font-size:20px;line-height:32px;margin:16px 0;font-weight:bold">
      Don&rsquo;t want to lose your sites and builds? Let us know ASAP!
    </p>
    <p style="${css.p}">
      If you&rsquo;d like to <a href="https://docs.cloud.gov/pages/using-pages/sandbox" style="${css.a}" target="_blank">convert your free sandbox</a> to a paid production space, please email us at
      <a href="mailto:pages-inquiries@cloud.gov" style="${css.a}" target="_blank">
      pages-inquiries@cloud.gov.</a>
    </p>

  `,
    `Your free Pages sandbox organization "${organizationName}" is about to expire.`,
  );
}

module.exports = sandboxReminder;
