import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PublishedState from './PublishedState';
import { dateAndTime } from '@util/datetime';

// Mock dateAndTime
jest.mock('@util/datetime', () => ({
  dateAndTime: jest.fn(),
}));

describe('<PublishedState />', () => {
  beforeEach(() => {
    dateAndTime.mockReset();
  });

  it('renders the "Last published on" message when site.publishedAt exists', () => {
    dateAndTime.mockReturnValue('December 31, 2024, 2:15 PM'); // Fixed return value
    const site = {
      publishedAt: '2024-12-31T14:15:00Z',
    }; // This exact value doesn't matter for this test

    render(<PublishedState site={site} />);

    const message = screen.getByText('Last published on December 31, 2024, 2:15 PM.');
    expect(message).toBeInTheDocument();
  });

  it('displays "Please wait" if site.publishedAt is missing', () => {
    const site = {};
    render(<PublishedState site={site} />);

    const message = screen.getByText(
      'Please wait for build to complete or check logs for error message.',
    );
    expect(message).toBeInTheDocument();
    expect(dateAndTime).not.toHaveBeenCalled();
  });

  it('calls dateAndTime() with site.publishedAt', () => {
    const publishedAt = '2024-12-31T14:15:00Z';
    const site = { publishedAt };

    render(<PublishedState site={site} />);

    expect(dateAndTime).toHaveBeenCalledWith(publishedAt);
  });
});
