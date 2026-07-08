import '@testing-library/jest-dom';
import globals from '@globals';
import { getOwnerAndRepo, getRepoUrl, getTemplateExampleUrl } from '@util/site';

describe('site frontend util', () => {
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

      expect(
        getOwnerAndRepo('https://github.com/user4/another-example-node-site'),
      ).toEqual({
        owner: 'user4',
        repository: 'another-example-node-site',
        sourceCodePlatform: 'github',
        sourceCodeUrl: 'https://github.com/user4/another-example-node-site',
        isWorkshop: false,
      });

      expect(
        getOwnerAndRepo('https://github.com/user4/another-example-node-site'),
      ).toEqual({
        owner: 'user4',
        repository: 'another-example-node-site',
        sourceCodePlatform: 'github',
        sourceCodeUrl: 'https://github.com/user4/another-example-node-site',
        isWorkshop: false,
      });
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

  describe('getRepoUrl', () => {
    it('does not create url if data missing', () => {
      expect(getRepoUrl('', null, null)).toEqual('');
      expect(getRepoUrl('github', '', '')).toEqual('');
      expect(getRepoUrl('github', 'owner', '')).toEqual('');
    });

    it('creates GitHub url', () => {
      expect(getRepoUrl('github', 'owner', 'repository')).toEqual(
        'https://github.com/owner/repository',
      );

      expect(
        getRepoUrl(globals.SOURCE_CODE_PLATFORM_GITHUB, 'owner', 'repository'),
      ).toEqual('https://github.com/owner/repository');
    });

    it('creates GitLab url', () => {
      expect(getRepoUrl('workshop', 'group/subgroup', 'project')).toEqual(
        'https://workshop.cloud.gov/group/subgroup/project',
      );
      expect(
        getRepoUrl(
          globals.SOURCE_CODE_PLATFORM_WORKSHOP,
          'org/group/subgroup',
          'project',
        ),
      ).toEqual('https://workshop.cloud.gov/org/group/subgroup/project');
    });

    it('does removes leading/trailing slashes from owner and repo', () => {
      expect(
        getRepoUrl('workshop', '////group/subgroup//////', '////project////'),
      ).toEqual('https://workshop.cloud.gov/group/subgroup/project');
    });
  });

  describe('getTemplateExampleUrl', () => {
    it('does not throw an error if there are no templates', () => {
      expect(getTemplateExampleUrl(null)).toBeFalsy();
      expect(getTemplateExampleUrl('')).toBeFalsy();
    });

    it('does not return a template example if one is not present', () => {
      expect(getTemplateExampleUrl('templates')).toBeFalsy();
      expect(getTemplateExampleUrl({})).toBeFalsy();
      expect(getTemplateExampleUrl({ template1: {} })).toBeFalsy();
    });

    it('does not return a template example if one is not present', () => {
      expect(getTemplateExampleUrl({ template1: { example: 'example 1' } })).toEqual(
        'example 1',
      );
      expect(
        getTemplateExampleUrl({
          template1: { example: 'example 1' },
          template2: { example: 'example 2' },
        }),
      ).toEqual('example 1');
    });
  });
});
