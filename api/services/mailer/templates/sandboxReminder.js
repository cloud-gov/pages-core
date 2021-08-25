function sandboxReminder({ organizationName, dateStr, organizationLink }) {
  return `
    <!DOCTYPE html>

    <html>
      <head lang="en">
        <meta charset="UTF-8" />
      </head>
      <body>
        <p>Hello!</p>
        <p>
          As a reminder, the sites in your <a href="${organizationLink}">sandbox organization ${organizationName}</a> will be deleted on ${dateStr}.</strong>
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
