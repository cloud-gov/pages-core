import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import FilterIndicator from './FilterIndicator';

describe('<FilterIndicator/>', () => {
  it('renders', () => {
    const count = 5;
    const criteria = 'test';
    render(<FilterIndicator count={count} criteria={criteria} />);

    const paragraph = screen.getByRole('paragraph');
    expect(paragraph).toHaveTextContent(
      `Showing ${count} matching results for ${criteria}.`,
    );
  });
});
