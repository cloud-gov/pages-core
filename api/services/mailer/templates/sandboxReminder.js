function sandboxReminder({ organizationId, dateStr, sites, hostname, organizationName }) {
  const organizationLink = `${hostname}/organizations/${organizationId}`;
  const sitesList = sites.map(s => `<li><a href="${hostname}/sites/${s.id}/builds">${s.owner}/${s.repository}</a></li>`).join('\n');
  return `
    <!DOCTYPE html>

    <html>
      <head lang="en">
        <meta charset="UTF-8" />
      </head>
      <body>
        <p>Hello!</p>
        <p>
          As a reminder, the website previews and settings created in your sandbox organization <a href="${organizationLink}">${organizationName}</a> will be removed from Pages on ${dateStr} for the following sites:
        </p>
        <p>
          <ul>
            ${sitesList}
          </ul>
        </p>
        <p>
          Please note that only data within the Pages platform is being removed and your sites' repositories will remain unchanged.
        </p>
        <p>
          Thank you,<br />
          <a href="https://cloud.gov/pages">cloud.gov Pages</a> team
        </p>
      </body>
    </html>
  `;
}

module.exports = sandboxReminder;
