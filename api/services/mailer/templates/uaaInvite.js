const layout = require('./layout');

function uaaInvite({ link }) {
  return layout(`
    <p>Hello!</p>
    <p>
      You've been invited to join
      <a href="https://cloud.gov/pages">cloud.gov Pages [1]</a>.
    </p>
    <p>
      cloud.gov Pages is a publishing platform for modern <a href="https://federalist.18f.gov/documentation/21st-century-idea/">21st Century IDEA </a>websites. There's no easier way to build, launch, and manage government sites.
    </p>
    <strong>Your next steps</strong>
    <p>
    <ol>
      <li>
      <strong>Accept the invitation</strong> - <a href="${link}">Accept your invite [2]</a> to continue the registration process. (The invitation will expire after 24 hours.) You can also copy the URL below and paste it into your browser's address bar:
      <br />
      ${link}
      </li>
      <li>
        <strong>Read the documentation</strong> - After you register and log in, review the <a href="https://federalist.18f.gov/documentation/customer-responsibilities">customer responsibilities [3]</a>.
      </li>
      <li>
      <strong>Then <a href="https://federalist.18f.gov/documentation/">set up your access and get started [4]</a></strong>.
      </li>
    </ol>
    </p>
    <p>
      If you run into problems or have any questions, please email us at <a href="mailto:pages-support@cloud.gov">pages-support@cloud.gov</a>.
    </p>
    <p>
      Thank you,<br />
      cloud.gov Pages team
    </p>
    <hr>
    <ul>
      <li>[1] cloud.gov Pages: https://cloud.gov/pages</li>
      <li>[2] Accept your invite: ${link}</li>
      <li>[3] Customer responsibilities: https://federalist.18f.gov/documentation/customer-responsibilities</li>
      <li>[4] Set up your access and get started: https://federalist.18f.gov/documentation/</li>
    </ul>
  `);
}

module.exports = uaaInvite;
