import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

import SiteListItem from './SiteListItem';
// import GitHubLink from '@shared/GitHubLink';
// import PublishedState from './PublishedState';

const mockOrganization = {
  name: 'Test Organization',
  isActive: true,
  isSandbox: false,
  daysUntilSandboxCleaning: 0,
  id: '1234',
};

const mockSite = {
  repository: 'test-repo',
  owner: 'test-owner',
  id: 1,
  publishedAt: '2024-12-18T00:00:00Z',
  repoLastVerified: '2024-12-17T00:00:00Z',
  createdAt: '2024-12-01T00:00:00Z',
  viewLink: '/sites/1/builds',
  isActive: true,
};

describe('<SiteListItem />', () => {
  it('renders the organization name in a heading element', () => {
    render(
      /* MemoryRouter allows us to render components that use react Link  */
      <MemoryRouter>
        <SiteListItem organization={mockOrganization} site={mockSite} />
      </MemoryRouter>,
    );
    const orgName = screen.getByRole('heading', {
      name: `organization - ${mockOrganization.name}`,
    });
    expect(orgName).toBeInTheDocument();
  });

  // eslint-disable-next-line max-len
  it('renders the site name by concatenating the site owner and repo name in a heading element', () => {
    render(
      /* MemoryRouter allows us to render components that use react Link  */
      <MemoryRouter>
        <SiteListItem organization={mockOrganization} site={mockSite} />
      </MemoryRouter>,
    );
    const combinedName = `${mockSite.owner}/${mockSite.repository}`;
    const text = screen.getByText(combinedName);
    expect(text).toBeInTheDocument();
  });

  it('renders the last published state', () => {
    render(
      <MemoryRouter>
        <SiteListItem organization={mockOrganization} site={mockSite} />
      </MemoryRouter>,
    );
    const publishedMessage = screen.getByText(/Last published on/i);
    expect(publishedMessage).toBeInTheDocument();
  });

  it('renders sandbox message when organization is a sandbox', () => {
    const sandboxOrg = {
      ...mockOrganization,
      isSandbox: true,
      daysUntilSandboxCleaning: 7,
    };
    render(
      <MemoryRouter>
        <SiteListItem organization={sandboxOrg} site={mockSite} />
      </MemoryRouter>,
    );
    const sandboxMsg = screen.getByText((content) =>
      content.includes(
        // eslint-disable-next-line max-len
        `All site data for this sandbox organization will be removed in ${sandboxOrg.daysUntilSandboxCleaning} days`,
      ),
    );
    expect(sandboxMsg).toBeInTheDocument();
  });

  // eslint-disable-next-line max-len
  it('renders the site name as a link to the site’s build history if site and org are active', () => {
    render(
      <MemoryRouter>
        <SiteListItem organization={mockOrganization} site={mockSite} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', {
      name: `${mockSite.owner}/${mockSite.repository}`,
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', `/sites/${mockSite.id}/builds`);
    expect(link).toHaveAttribute('title', `View site builds`);
  });

  // eslint-disable-next-line max-len
  it('renders the site name as text with "(Inactive)" instead of a link if org is inactive', () => {
    const inactiveOrg = { ...mockOrganization, isActive: false };
    render(<SiteListItem organization={inactiveOrg} site={mockSite} />);
    const text = screen.getByText(`${mockSite.owner}/${mockSite.repository} (Inactive)`);
    const link = screen.queryByRole('link', {
      name: `${mockSite.owner}/${mockSite.repository}`,
    });
    expect(link).not.toBeInTheDocument();
    expect(text).toBeInTheDocument();
  });

  // eslint-disable-next-line max-len
  it('renders the site name as text with "(Inactive)" instead of a link if site is inactive', () => {
    const inactiveSite = { ...mockSite, isActive: false };
    render(<SiteListItem organization={mockOrganization} site={inactiveSite} />);
    const link = screen.queryByRole('link', {
      name: `${mockSite.owner}/${mockSite.repository}`,
    });
    const text = screen.getByText(
      `${inactiveSite.owner}/${inactiveSite.repository} (Inactive)`,
    );
    expect(link).not.toBeInTheDocument();
    expect(text).toBeInTheDocument();
  });
});
