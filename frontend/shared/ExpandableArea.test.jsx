import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import ExpandableArea from './ExpandableArea';

describe('<ExpandableArea/>', () => {
  it('renders', () => {
    const title = 'Test Title';
    render(
      <ExpandableArea title={title}>
        <p>hello</p>
      </ExpandableArea>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(title);
  });
});
