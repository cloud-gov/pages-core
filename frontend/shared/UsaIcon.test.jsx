import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UsaIcon from './UsaIcon';

describe('<UsaIcon />', () => {
  it('renders an SVG icon with USDWDS classes', () => {
    render(<UsaIcon name="check" />);
    const svgElement = screen.getByRole('img');
    expect(svgElement).toBeInstanceOf(SVGSVGElement);
    expect(svgElement).toHaveClass('usa-icon');
  });

  it('renders the icon as unfocusable img role', () => {
    render(<UsaIcon name="check" />);
    const svgElement = screen.getByRole('img');
    expect(svgElement).toHaveAttribute('focusable', 'false');
  });

  it('renders the icon as focusable when the role is button', () => {
    render(<UsaIcon name="check" role="button" />);
    const svgElement = screen.getByRole('button');
    expect(svgElement).toHaveAttribute('focusable', 'true');
  });

  it('renders the icon as focusable when the role is link', () => {
    render(<UsaIcon name="check" role="link" />);
    const svgElement = screen.getByRole('link');
    expect(svgElement).toHaveAttribute('focusable', 'true');
  });

  it('renders the icon with a size class when size is set', () => {
    render(<UsaIcon name="check" size={4} />);
    const svgElement = screen.getByRole('img');
    expect(svgElement).toHaveClass('usa-icon--size-4');
  });

  it('uses a role attribute when provided', () => {
    render(<UsaIcon name="check" role="presentation" />);
    const svgElement = screen.getByRole('presentation');
    expect(svgElement).toBeInTheDocument();
  });
});
