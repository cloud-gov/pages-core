import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import ButtonLink from './ButtonLink';
const clickHandler = jest.fn();

describe('<ButtonLink />', () => {
  it('renders children as expected', () => {
    render(<ButtonLink clickHandler={clickHandler}>child text</ButtonLink>);
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveTextContent('child text');
  });

  it('calls the clickHandler when clicked', () => {
    render(<ButtonLink clickHandler={clickHandler}>Click Me</ButtonLink>);
    const buttonElement = screen.getByText('Click Me');
    fireEvent.click(buttonElement);
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it('applies the className as expected', () => {
    render(
      <ButtonLink clickHandler={clickHandler} className="custom-class">
        Class Button
      </ButtonLink>,
    );
    const buttonElement = screen.getByText('Class Button');
    expect(buttonElement).toHaveClass('usa-button custom-class');
  });

  it('defaults to usa-button--outline class if no className is provided', () => {
    render(<ButtonLink clickHandler={clickHandler}>No Class</ButtonLink>);
    const buttonElement = screen.getByText('No Class');
    expect(buttonElement).toHaveClass('usa-button--outline');
  });
});
