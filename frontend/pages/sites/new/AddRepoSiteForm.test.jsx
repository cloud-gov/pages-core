import React from 'react';
import { AddRepoSiteForm } from '@pages/sites/new/AddRepoSiteForm';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('redux-form', () => ({
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

describe('<AddRepoSiteForm />', () => {
  const props = {
    organizations: { data: [] },
    handleSubmit: jest.fn(),
    pristine: false,
    submitting: false,
    invalid: false,
    valid: true,
  };

  it("renders selection for site's engine", () => {
    render(<AddRepoSiteForm {...props} />);
    expect(screen.getByText("Select the site's engine")).toBeInTheDocument();
    expect(screen.getByText('Please select a site engine')).toBeInTheDocument();
  });
});
