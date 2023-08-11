import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import LoadingIndicator from './LoadingIndicator';

describe('<LoadingIndicator/>', () => {
  it('renders', () => {
    render(<LoadingIndicator />);
    screen.getByText('Loading...');
  });
});
