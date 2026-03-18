import '@testing-library/jest-dom';
import { getOwnerAndRepo } from '@pages/sites/new/index';
import globals from '@globals';

describe('getOwnerAndRepo', () => {
  it('parses url to extract GitHub owner and repo', () => {
    expect(getOwnerAndRepo('', true)).toEqual({
      owner: undefined,
      repository: undefined,
      sourceCodePlatform: 'github',
      sourceCodeUrl: '',
    });

    expect(getOwnerAndRepo('', false)).toEqual({
      owner: undefined,
      repository: undefined,
      sourceCodePlatform: 'github',
      sourceCodeUrl: '',
    });

    expect(
      getOwnerAndRepo('https://github.com/user4/another-example-node-site', true),
    ).toEqual({
      owner: 'user4',
      repository: 'another-example-node-site',
      sourceCodePlatform: 'github',
      sourceCodeUrl: 'https://github.com/user4/another-example-node-site',
    });

    expect(
      getOwnerAndRepo('https://github.com/user4/another-example-node-site', false),
    ).toEqual({
      owner: 'user4',
      repository: 'another-example-node-site',
      sourceCodePlatform: 'github',
      sourceCodeUrl: 'https://github.com/user4/another-example-node-site',
    });
  });

  it('parses url to extract GitLab owner and repo', () => {
    globals.GITLAB_BASE_URL = 'https://workshop.cloud.gov';

    expect(
      getOwnerAndRepo(
        'https://workshop.cloud.gov/cloud-gov/pages/pages-uswds-11ty',
        true,
      ),
    ).toEqual({
      owner: 'cloud-gov',
      repository: 'pages/pages-uswds-11ty',
      sourceCodePlatform: 'workshop',
      sourceCodeUrl: 'https://workshop.cloud.gov/cloud-gov/pages/pages-uswds-11ty',
    });

    expect(
      getOwnerAndRepo(
        'https://workshop.cloud.gov/cloud-gov/pages/pages-uswds-11ty',
        false,
      ),
    ).toEqual({
      owner: 'cloud-gov',
      repository: 'pages',
      sourceCodePlatform: 'github',
      sourceCodeUrl: 'https://workshop.cloud.gov/cloud-gov/pages/pages-uswds-11ty',
    });

    expect(
      getOwnerAndRepo('https://workshop.cloud.gov/anna.fishman/project-slug', true),
    ).toEqual({
      owner: 'anna.fishman',
      repository: 'project-slug',
      sourceCodePlatform: 'workshop',
      sourceCodeUrl: 'https://workshop.cloud.gov/anna.fishman/project-slug',
    });

    expect(
      getOwnerAndRepo('https://workshop.cloud.gov/anna.fishman/project-slug', false),
    ).toEqual({
      owner: 'anna.fishman',
      repository: 'project-slug',
      sourceCodePlatform: 'github',
      sourceCodeUrl: 'https://workshop.cloud.gov/anna.fishman/project-slug',
    });
  });
});
