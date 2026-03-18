import '@testing-library/jest-dom';
import { sourceCodePlatformUrl } from '@shared/Fields/SourceCodePlatformUrlField';

describe('sourceCodePlatformUrl', () => {
  it('validates GitHub URL', () => {
    process.env.FEATURE_WORKSHOP_INTEGRATION = 'true';
    expect(sourceCodePlatformUrl('https://github.com/afishman-2025/test2')).toEqual(
      undefined,
    );

    process.env.FEATURE_WORKSHOP_INTEGRATION = 'false';
    expect(sourceCodePlatformUrl('https://github.com/afishman-2025/test2')).toEqual(
      undefined,
    );
  });

  it('validates GitLab URL with group', () => {
    process.env.FEATURE_WORKSHOP_INTEGRATION = 'true';
    expect(
      sourceCodePlatformUrl('https://workshop.cloud.gov/firstname.lastname/project-slug'),
    ).toEqual(undefined);

    process.env.FEATURE_WORKSHOP_INTEGRATION = 'false';
    expect(
      sourceCodePlatformUrl('https://workshop.cloud.gov/firstname.lastname/project-slug'),
    ).toEqual('URL is not formatted correctly');
  });

  it('validates GitLab URL with group and subgroup', () => {
    process.env.FEATURE_WORKSHOP_INTEGRATION = 'true';
    expect(
      sourceCodePlatformUrl(
        'https://workshop.cloud.gov/cloud-gov/pages/pages-uswds-11ty',
      ),
    ).toEqual(undefined);

    process.env.FEATURE_WORKSHOP_INTEGRATION = 'false';
    expect(
      sourceCodePlatformUrl(
        'https://workshop.cloud.gov/cloud-gov/pages/pages-uswds-11ty',
      ),
    ).toEqual('URL is not formatted correctly');
  });

  it('invalidates URL', () => {
    expect(sourceCodePlatformUrl('https://some.url')).toEqual(
      'URL is not formatted correctly',
    );
  });
});
