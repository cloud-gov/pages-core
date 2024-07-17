import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import ExpandableArea from '../frontend/components/ExpandableArea';

describe('<ExpandableArea/>', () => {
  it('renders', () => {
    const title = 'Test Title';
    render(
      <ExpandableArea title={title}>
        <p>hello</p>
      </ExpandableArea>,
    );

    const area = screen.findByRole('div');
    expect(area).toHaveClass('usa-accordian');
    expect(area).toHaveAttribute('aria-hidden', true);

    const button = area.findByRole('button');
    expect(button).toHaveTextContent(title);
  });
});
