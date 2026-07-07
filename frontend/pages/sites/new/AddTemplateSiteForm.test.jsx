import React from 'react';
import { AddTemplateSiteForm } from '@pages/sites/new/AddTemplateSiteForm';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import '@testing-library/jest-dom';

let mockSelectorImpl = () => undefined;

function mockSelector(state, field) {
  return mockSelectorImpl(state, field);
}

jest.mock('redux-form', () => ({
  ...jest.requireActual('redux-form'),
  reduxForm: () => (component) => {
    const WrappedComponent = (props) => {
      const defaultProps = {
        handleSubmit: jest.fn(),
        pristine: false,
        submitting: false,
        invalid: false,
        valid: true,
        ...props,
      };
      return component(defaultProps);
    };
    const displayName = `${component.displayName || component.name}`;
    WrappedComponent.displayName = `reduxForm(${displayName})`;
    return WrappedComponent;
  },
  formValueSelector: jest.fn(() => mockSelector),

  // eslint-disable-next-line react/prop-types
  Field: ({ name, component: Component = 'input', type, ...props }) => {
    if (typeof Component === 'string') {
      return (
        <Component name={name} type={type} data-testid={`field-${name}`} {...props} />
      );
    }

    const mockInput = {
      name,
      // eslint-disable-next-line react/prop-types
      value: props.value || '',
      onChange: jest.fn(),
      onBlur: jest.fn(),
    };

    const mockMeta = {
      touched: false,
      error: null,
      invalid: false,
    };

    return <Component input={mockInput} meta={mockMeta} {...props} />;
  },
}));

function renderWithProvider(ui, { preloadedState = {} } = {}) {
  const rootReducer = combineReducers({ form: formReducer });
  const store = createStore(rootReducer, preloadedState);
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('<AddTemplateSiteForm />', () => {
  const props = {
    organizations: { data: [] },
    handleSubmit: jest.fn(),
    pristine: false,
    submitting: false,
    invalid: false,
    valid: true,
    initialValues: {},
  };

  it('renders template site form', () => {
    process.env.FEATURE_WORKSHOP_INTEGRATION = 'true';
    mockSelectorImpl = (state, field) =>
      field === 'sourceCodePlatform' ? '' : undefined;

    renderWithProvider(<AddTemplateSiteForm {...props} />);
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
    mockSelectorImpl = (state, field) => {
      const values = {
        sourceCodePlatform: 'github',
        owner: '/owner//',
        repository: '/repository/',
      };
      return values[field];
    };

    renderWithProvider(<AddTemplateSiteForm {...props} />);
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
    mockSelectorImpl = (state, field) => {
      const values = {
        sourceCodePlatform: 'workshop',
        owner: '/group/subgroup//',
        repository: '/project/',
      };
      return values[field];
    };

    renderWithProvider(<AddTemplateSiteForm {...props} />);
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
    mockSelectorImpl = (state, field) =>
      field === 'sourceCodePlatform' ? '' : undefined;

    renderWithProvider(<AddTemplateSiteForm {...props} />);
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
