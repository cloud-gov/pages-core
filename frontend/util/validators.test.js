import { validAddRepoSiteForm } from '@util/validators';

describe('validAddRepoSiteForm', () => {
  const repoUrl = 'https://example.com/org/repo';
  const repoOrganizationId = 1;
  const engine = 'test-engine';
  const withOrgs = {
    data: [
      {
        name: 'org-1',
        id: 1,
      },
    ],
  };
  const withoutOrgs = {
    data: [],
  };

  it('should return an empty object if repoUrl and repoOrganizationId are valid', () => {
    const expected = validAddRepoSiteForm(
      {
        repoUrl,
        repoOrganizationId,
        engine,
      },
      {
        organizations: withOrgs,
      },
    );
    expect(expected).toEqual({});
  });

  it('should return an empty object if just repoUrl is valid without org', () => {
    const expected = validAddRepoSiteForm(
      { repoUrl, engine },
      {
        organizations: withoutOrgs,
      },
    );
    expect(expected).toEqual({});
  });

  it('should return an object with repoUrl key if repoUrl is not truthy', () => {
    const expected = validAddRepoSiteForm(
      {
        repoUrl: null,
        repoOrganizationId,
      },
      {
        organizations: withOrgs,
      },
    );
    expect(expected.repoUrl).toBe('Please enter a Github repository URL');
  });

  it('should return an object with repoOrganizationId key if it is not truthy', () => {
    const expected = validAddRepoSiteForm(
      {
        repoUrl,
        repoOrganizationId: null,
      },
      {
        organizations: withOrgs,
      },
    );
    expect(expected.repoOrganizationId).toBe('Please select an organization');
  });

  it('should return an object with engine key if engine is not truthy', () => {
    const expected = validAddRepoSiteForm(
      {
        repoUrl,
        repoOrganizationId: repoOrganizationId,
      },
      {
        organizations: withOrgs,
      },
    );
    expect(expected.engine).toBe('Please select a site engine');
  });
});
