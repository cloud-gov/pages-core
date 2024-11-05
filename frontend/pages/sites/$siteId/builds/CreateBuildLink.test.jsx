import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { spy } from 'sinon';
import CreateBuildLink from './CreateBuildLink';

describe('<CreateBuildLink />', () => {
  const props = {
    handlerParams: { dish: 'tacos', cuisine: 'mexican' },
    handleClick: spy(),
    children: 'hey there',
  };

  test('it renders', () => {
    render(<CreateBuildLink {...props} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('it calls the .handleClick function, passing handler params', () => {
    render(<CreateBuildLink {...props} />);
    const handler = props.handleClick;
    const params = props.handlerParams;

    fireEvent.click(screen.getByRole('button'));
    expect(handler.calledOnce).toBeTruthy();
    expect(
      handler.calledWith(...Object.keys(params).map((key) => params[key])),
    ).toBeTruthy();
  });
});
