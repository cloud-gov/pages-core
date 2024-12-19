import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { createFixtureSite } from '../../../test/frontend/support/data/sites';
import { createFixtureOrg } from '../../../test/frontend/support/data/organizations';
import * as datetimeUtils from '@util/datetime';

import SiteListItem from './SiteListItem';
import GitHubLink from '@shared/GitHubLink';

const mockSite = createFixtureSite({ name: 'test-site' });
const mockOrganization = createFixtureOrg({ name: 'test-org' });

jest.mock('@shared/GitHubLink', () => {
  return jest.fn(() => null);
});

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

  describe('renders the last published state', () => {
    let dateAndTimeSpy;

    beforeEach(() => {
      dateAndTimeSpy = jest.spyOn(datetimeUtils, 'dateAndTime');
    });
    afterEach(() => {
      dateAndTimeSpy.mockRestore();
    });

    it('renders the "Last published on" message when publishedAt exists', () => {
      const formattedDate = datetimeUtils.dateAndTime(mockSite.publishedAt);

      render(
        <MemoryRouter>
          <SiteListItem organization={mockOrganization} site={mockSite} />
        </MemoryRouter>,
      );

      const message = screen.getByText(`Last published on ${formattedDate}`);
      expect(message).toBeInTheDocument();
    });

    it('displays "Please wait" if publishedAt is null', () => {
      const unPublishedSite = {
        ...mockSite,
        publishedAt: null,
      };
      render(
        <MemoryRouter>
          <SiteListItem organization={mockOrganization} site={unPublishedSite} />
        </MemoryRouter>,
      );
      const message = screen.getByText(
        'Please wait for build to complete or check logs for error message.',
      );
      expect(message).toBeInTheDocument();
      expect(dateAndTimeSpy).not.toHaveBeenCalled();
    });
  });

  it('renders a button link to the GitHub repo for this site', () => {
    render(
      <MemoryRouter>
        <SiteListItem organization={mockOrganization} site={mockSite} />
      </MemoryRouter>,
    );
    expect(GitHubLink).toHaveBeenCalledWith(
      {
        owner: mockSite.owner,
        repository: mockSite.repository,
        text: 'View repo',
        isButton: true,
      },
      expect.anything(), // ref
    );
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
