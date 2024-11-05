import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import AlertBanner from './alertBanner';

const statusTypes = ['error', 'info'];

describe('<AlertBanner/>', () => {
  test('it does not appear without a message', () => {
    render(<AlertBanner />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  statusTypes.forEach((status) => {
    test(`it has the correct status when the status is ${status}`, () => {
      render(<AlertBanner message="hello" status={status} />);
      expect(screen.getByRole('alert')).toHaveClass(`usa-alert--${status}`);
    });
  });

  test('it falls back to an info banner when status is not provided', () => {
    render(<AlertBanner message="hello" />);
    expect(screen.getByRole('alert')).toHaveClass('usa-alert--info');
  });

  test('it can render a component as a message', () => {
    const componentText = 'Hey there';
    const child = <button type="button">{componentText}</button>;
    render(<AlertBanner message={child} />);
    expect(screen.getByRole('button')).toHaveTextContent(componentText);
  });

  test('it can opt out of displaying `role="alert"`', () => {
    render(<AlertBanner message="hi" alertRole={false} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('hi')).toBeInTheDocument();
  });
});
