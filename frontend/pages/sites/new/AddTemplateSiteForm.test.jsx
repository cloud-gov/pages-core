import React from 'react';
import { AddTemplateSiteForm } from '@pages/sites/new/AddTemplateSiteForm';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

function selectSourceCodePlatform(value) {
  fireEvent.change(screen.getByLabelText('Source code provider'), {
    target: { value },
  });
}

function fillOwnerAndRepository(ownerLabel, repositoryLabel, owner, repository) {
  fireEvent.change(screen.getByLabelText(ownerLabel), {
    target: { name: 'owner', value: owner },
  });
  fireEvent.change(screen.getByLabelText(repositoryLabel), {
    target: { name: 'repository', value: repository },
  });
}

describe('<AddTemplateSiteForm />', () => {
  const props = {
    organizations: { data: [] },
    onSubmit: jest.fn(),
  };

  it('renders template site form', () => {
    process.env.FEATURE_WORKSHOP_INTEGRATION = 'true';

    render(<AddTemplateSiteForm {...props} />);
    expect(
      screen.getByText('Cloud.gov Pages organization to contain this site'),
    ).toBeInTheDocument();
    expect(screen.getByText('Source code provider')).toBeInTheDocument();
    expect(
      screen.getByText('GitHub account or GitLab namespace your site belongs to'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        // eslint-disable-next-line max-len
        'Name your new site and GitHub repository or GitLab project (lowercase, no spaces)',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('New site will be created at')).toBeInTheDocument();
  });

  it('renders template site form with GitHub selected as a source code platform', () => {
    process.env.FEATURE_WORKSHOP_INTEGRATION = 'true';

    render(<AddTemplateSiteForm {...props} />);
    selectSourceCodePlatform('github');
    fillOwnerAndRepository(
      'GitHub account your site belongs to',
      'Name your new site and GitHub repository (lowercase, no spaces)',
      '/owner//',
      '/repository/',
    );

    expect(
      screen.getByText('Cloud.gov Pages organization to contain this site'),
    ).toBeInTheDocument();
    expect(screen.getByText('Source code provider')).toBeInTheDocument();
    expect(screen.getByText('GitHub account your site belongs to')).toBeInTheDocument();
    expect(
      screen.getByText('Name your new site and GitHub repository (lowercase, no spaces)'),
    ).toBeInTheDocument();
    expect(screen.getByText('New site will be created at')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://github.com/owner/repository'),
    ).toBeInTheDocument();
  });

  it('renders template site form with GitLab selected as a source code platform', () => {
    process.env.FEATURE_WORKSHOP_INTEGRATION = 'true';

    render(<AddTemplateSiteForm {...props} />);
    selectSourceCodePlatform('workshop');
    fillOwnerAndRepository(
      'GitLab namespace your site belongs to',
      'Name your new site and GitLab project (lowercase, no spaces)',
      '/group/subgroup//',
      '/project/',
    );

    expect(
      screen.getByText('Cloud.gov Pages organization to contain this site'),
    ).toBeInTheDocument();
    expect(screen.getByText('Source code provider')).toBeInTheDocument();
    expect(screen.getByText('GitLab namespace your site belongs to')).toBeInTheDocument();
    expect(
      screen.getByText('Name your new site and GitLab project (lowercase, no spaces)'),
    ).toBeInTheDocument();
    expect(screen.getByText('New site will be created at')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://workshop.cloud.gov/group/subgroup/project'),
    ).toBeInTheDocument();
  });

  it('renders template site form with Workshop integration off', () => {
    process.env.FEATURE_WORKSHOP_INTEGRATION = 'false';

    render(<AddTemplateSiteForm {...props} />);
    expect(
      screen.getByText('Cloud.gov Pages organization to contain this site'),
    ).toBeInTheDocument();
    expect(screen.getByText('Source code provider')).toBeInTheDocument();
    expect(screen.getByText('GitHub account your site belongs to')).toBeInTheDocument();
    expect(
      screen.getByText('Name your new site and GitHub repository (lowercase, no spaces)'),
    ).toBeInTheDocument();
    expect(screen.getByText('New site will be created at')).toBeInTheDocument();
  });
});

describe('<AddTemplateSiteForm /> submission and validation', () => {
  const organizations = { data: [{ id: 1, name: 'Org A' }] };

  function fillValidForm() {
    fireEvent.change(
      screen.getByLabelText('Cloud.gov Pages organization to contain this site'),
      { target: { name: 'repoOrganizationId', value: '1' } },
    );
    selectSourceCodePlatform('github');
    fillOwnerAndRepository(
      'GitHub account your site belongs to',
      'Name your new site and GitHub repository (lowercase, no spaces)',
      'owner',
      'repository',
    );
  }

  beforeEach(() => {
    process.env.FEATURE_WORKSHOP_INTEGRATION = 'true';
  });

  it('disables submit (blocking onSubmit) until the form is dirty and valid', () => {
    const onSubmit = jest.fn();
    render(<AddTemplateSiteForm organizations={organizations} onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', {
      name: 'Create new site from template',
    });
    expect(submitButton).toBeDisabled();

    fireEvent.click(submitButton);
    expect(onSubmit).not.toHaveBeenCalled();

    fillValidForm();

    expect(submitButton).toBeEnabled();
  });

  it('calls onSubmit with the entered values when the form is submitted valid', () => {
    const onSubmit = jest.fn();
    render(<AddTemplateSiteForm organizations={organizations} onSubmit={onSubmit} />);

    fillValidForm();
    fireEvent.click(
      screen.getByRole('button', { name: 'Create new site from template' }),
    );

    expect(onSubmit).toHaveBeenCalledWith({
      repoOrganizationId: '1',
      sourceCodePlatform: 'github',
      owner: 'owner',
      repository: 'repository',
    });
  });

  it('clears the form and disables submit again after submitting', () => {
    const onSubmit = jest.fn();
    render(<AddTemplateSiteForm organizations={organizations} onSubmit={onSubmit} />);

    fillValidForm();
    const submitButton = screen.getByRole('button', {
      name: 'Create new site from template',
    });

    fireEvent.click(submitButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(submitButton).toBeDisabled();

    fireEvent.click(submitButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    expect(
      screen.getByLabelText('Cloud.gov Pages organization to contain this site'),
    ).toHaveValue('');
    expect(screen.getByLabelText('Source code provider')).toHaveValue('');
    expect(screen.getByLabelText(/your site belongs to/)).toHaveValue('');
    expect(screen.getByLabelText(/Name your new site and/)).toHaveValue('');
    expect(screen.queryByText('Please select an organization')).not.toBeInTheDocument();
  });

  it('does not call onSubmit when the form is submitted while invalid', () => {
    const onSubmit = jest.fn();
    const { container } = render(
      <AddTemplateSiteForm organizations={organizations} onSubmit={onSubmit} />,
    );

    /* eslint-disable testing-library/no-container, testing-library/no-node-access */
    fireEvent.submit(container.querySelector('form'));
    /* eslint-enable testing-library/no-container, testing-library/no-node-access */

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a field error only after it has been touched and left invalid', () => {
    render(<AddTemplateSiteForm organizations={organizations} onSubmit={jest.fn()} />);

    expect(screen.queryByText('Please select an organization')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Please select source code provider'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Please select an owner')).not.toBeInTheDocument();
    expect(screen.queryByText('Please select a repository')).not.toBeInTheDocument();

    const orgSelect = screen.getByLabelText(
      'Cloud.gov Pages organization to contain this site',
    );
    fireEvent.change(orgSelect, { target: { name: 'repoOrganizationId', value: '1' } });
    fireEvent.change(orgSelect, { target: { name: 'repoOrganizationId', value: '' } });

    const platformSelect = screen.getByLabelText('Source code provider');
    fireEvent.change(platformSelect, { target: { value: 'github' } });
    fireEvent.change(platformSelect, { target: { value: '' } });

    const ownerInput = screen.getByLabelText(/your site belongs to/);
    fireEvent.change(ownerInput, { target: { name: 'owner', value: 'owner' } });
    fireEvent.change(ownerInput, { target: { name: 'owner', value: '' } });

    const repositoryInput = screen.getByLabelText(/Name your new site and/);
    fireEvent.change(repositoryInput, { target: { name: 'repository', value: 'repo' } });
    fireEvent.change(repositoryInput, { target: { name: 'repository', value: '' } });

    expect(screen.getByText('Please select an organization')).toBeInTheDocument();
    expect(screen.getByText('Please select source code provider')).toBeInTheDocument();
    expect(screen.getByText('Please select an owner')).toBeInTheDocument();
    expect(screen.getByText('Please select a repository')).toBeInTheDocument();
  });
});
