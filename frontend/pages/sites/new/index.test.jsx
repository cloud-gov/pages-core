import '@testing-library/jest-dom';
import globals from '@globals';
import { getOwnerAndRepo } from '@util/site';

describe('getOwnerAndRepo', () => {
  it('parses url to extract GitHub owner and repo', () => {
    expect(getOwnerAndRepo('')).toEqual({
      owner: undefined,
      repository: undefined,
      sourceCodePlatform: 'github',
      sourceCodeUrl: '',
      isWorkshop: false,
    });

    expect(getOwnerAndRepo('')).toEqual({
      owner: undefined,
      repository: undefined,
      sourceCodePlatform: 'github',
      sourceCodeUrl: '',
      isWorkshop: false,
    });

    expect(getOwnerAndRepo('https://github.com/user4/another-example-node-site')).toEqual(
      {
        owner: 'user4',
        repository: 'another-example-node-site',
        sourceCodePlatform: 'github',
        sourceCodeUrl: 'https://github.com/user4/another-example-node-site',
        isWorkshop: false,
      },
    );

    expect(getOwnerAndRepo('https://github.com/user4/another-example-node-site')).toEqual(
      {
        owner: 'user4',
        repository: 'another-example-node-site',
        sourceCodePlatform: 'github',
        sourceCodeUrl: 'https://github.com/user4/another-example-node-site',
        isWorkshop: false,
      },
    );
  });

  it('parses url to extract GitLab owner and repo', () => {
    globals.GITLAB_BASE_URL = 'https://workshop.cloud.gov';

    expect(
      getOwnerAndRepo('https://workshop.cloud.gov/cloud-gov/pages/pages-uswds-11ty'),
    ).toEqual({
      owner: 'cloud-gov',
      repository: 'pages/pages-uswds-11ty',
      sourceCodePlatform: 'workshop',
      sourceCodeUrl: 'https://workshop.cloud.gov/cloud-gov/pages/pages-uswds-11ty',
      isWorkshop: true,
    });

    expect(
      getOwnerAndRepo('https://workshop.cloud.gov/anna.fishman/project-slug'),
    ).toEqual({
      owner: 'anna.fishman',
      repository: 'project-slug',
      sourceCodePlatform: 'workshop',
      sourceCodeUrl: 'https://workshop.cloud.gov/anna.fishman/project-slug',
      isWorkshop: true,
    });
  });
});
