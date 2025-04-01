import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QueryPage from './QueryPage';

const QueryPageComponent = (props) => (
  <MemoryRouter>
    <QueryPage {...props} />
  </MemoryRouter>
);

describe('<QueryPage />', () => {
  const children = 'Hello';
  const initProps = {
    children,
    data: null,
    dataHeader: null,
    dataMessage: null,
    error: null,
    errorMessage: null,
    isPending: false,
    isPlaceholderData: false,
  };

  test('it renders', () => {
    render(<QueryPageComponent {...initProps} />);
    expect(screen.getByText(children)).toBeInTheDocument();
  });

  test('it does not render children with placeholder data', () => {
    render(<QueryPageComponent {...initProps} isPlaceholderData={true} />);
    expect(screen.queryByText(children)).not.toBeInTheDocument();
  });

  test('it renders with default empty data alert', () => {
    const props = { ...initProps, data: [] };
    render(<QueryPageComponent {...props} />);
    screen.debug;
    expect(screen.getByText('No data available.')).toBeInTheDocument();
    expect(
      screen.getByText('There is no data currently available for this page.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(children)).not.toBeInTheDocument();
  });

  test('it renders with custom empty data alert', () => {
    const dataHeader = 'This is a header';
    const dataMessage = 'This is a message';
    const props = { ...initProps, data: [], dataHeader, dataMessage };
    render(<QueryPageComponent {...props} />);
    expect(screen.getByText(dataHeader)).toBeInTheDocument();
    expect(screen.getByText(dataMessage)).toBeInTheDocument();
    expect(screen.queryByText(children)).not.toBeInTheDocument();
  });

  test('it renders with default error alert', () => {
    const defaultErrorMessage = 'This is an error';
    const error = new Error(defaultErrorMessage);
    const props = { ...initProps, error };
    render(<QueryPageComponent {...props} />);
    expect(screen.getByText(defaultErrorMessage)).toBeInTheDocument();
    expect(screen.queryByText(children)).not.toBeInTheDocument();
  });

  test('it renders with custom error alert', () => {
    const error = new Error('This is an error');
    const errorMessage = 'My custom error message';
    const props = { ...initProps, error, errorMessage };
    render(<QueryPageComponent {...props} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByText(children)).not.toBeInTheDocument();
  });

  test('it renders loading indicator when peding', () => {
    const props = { ...initProps, isPending: true };
    render(<QueryPageComponent {...props} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText(children)).not.toBeInTheDocument();
  });
});
