import { expect } from 'chai';
import validators from '../../../frontend/util/validators';

describe('validAddRepoSiteForm', () => {
  const repoUrl = 'https://example.com/org/repo';
  const repoOrganizationId = 1;
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
    const expected = validators.validAddRepoSiteForm(
      {
        repoUrl,
        repoOrganizationId,
      },
      {
        organizations: withOrgs,
      },
    );
    expect(expected).to.be.empty;
  });

  it('should return an empty object if just repoUrl is valid without organizations', () => {
    const expected = validators.validAddRepoSiteForm(
      { repoUrl },
      {
        organizations: withoutOrgs,
      },
    );
    expect(expected).to.be.empty;
  });

  it('should return an object with repoUrl key if repoUrl is not truthy', () => {
    const expected = validators.validAddRepoSiteForm(
      {
        repoUrl: null,
        repoOrganizationId,
      },
      {
        organizations: withOrgs,
      },
    );
    expect(expected.repoUrl).to.equal('Please enter a Github repository URL');
  });

  it('should return an object with repoOrganizationId key if repoOrganizationId is not truthy', () => {
    const expected = validators.validAddRepoSiteForm(
      {
        repoUrl,
        repoOrganizationId: null,
      },
      {
        organizations: withOrgs,
      },
    );
    expect(expected.repoOrganizationId).to.equal('Please select an organization');
  });
});
