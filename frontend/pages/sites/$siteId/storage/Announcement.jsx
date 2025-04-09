import React from 'react';
import AlertBanner from '@shared/alertBanner';

export default function Announcement() {
  const message = (
    <span>
      We&apos;re excited to announce an upcoming new public file storage feature! 🎉 With
      this new feature, you&apos;ll be able to upload and share files publicly from your
      existing site and simply manage your public files in Pages.
      <br />
      <br />
      Interested in trying out the new public file storage? Reach out to us at{' '}
      <a
        title="Email support to launch a custom domain."
        href="mailto:pages-support@cloud.gov"
      >
        pages-support@cloud.gov
      </a>{' '}
      to get on the waitlist.
    </span>
  );

  return <AlertBanner status="info" header="Coming Soon!" message={message} />;
}
