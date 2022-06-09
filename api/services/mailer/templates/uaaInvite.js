const layout = require('./layout');

function uaaInvite({ link }) {
  return layout(`
    <p>Hello!</p>
    <p>
      You've been invited to join
      <a href="https://cloud.gov/pages">cloud.gov Pages </a> <sup>[1]</sup>.
    </p>
    <p>
      cloud.gov Pages is a publishing platform for modern <a href="https://digital.gov/resources/21st-century-integrated-digital-experience-act">21st Century IDEA </a> <sup>[2]</sup> websites. There's no easier way to build, launch, and manage government sites.
    </p>
    <strong>Your next steps</strong>
    <p>
    <ol>
      <li>
      <strong>Accept the invitation</strong> - <a href="${link}">Accept your invite </a> <sup>[3]</sup> to continue the registration process. (The invitation will expire after 24 hours.) You can also copy the URL below and paste it into your browser's address bar:
      <br /><br />
      ${link}
      </li>
      <li>
        <strong>Read the documentation</strong> - After you register and log in, review the <a href="https://cloud.gov/pages/documentation/customer-responsibilities">customer responsibilities </a> <sup>[4]</sup>.
      </li>
      <li>
      <strong>Get started</strong> - <a href="https://pages.cloud.gov">cloud.gov Pages application </a> <sup>[5]</sup>.
      </li>
    </ol>
    </p>
    <p>
      If you run into problems or have any questions, please email us at <a href="mailto:pages-support@cloud.gov">pages-support@cloud.gov</a>.
    </p>
    <p>
      Thank you,<br /><br />
      The cloud.gov Pages team
    </p>
    <hr>
    <ul>
      <li>[1] cloud.gov Pages: https://cloud.gov/pages</li>
      <li>[2] 21st Century IDEA: https://digital.gov/resources/21st-century-integrated-digital-experience-act</li>
      <li>[3] Accept your invite: ${link}</li>
      <li>[4] Customer responsibilities: https://cloud.gov/pages/documentation/customer-responsibilities</li>
      <li>[5] Get started: https://pages.cloud.gov</li>
    </ul>
  `);
}

module.exports = uaaInvite;
