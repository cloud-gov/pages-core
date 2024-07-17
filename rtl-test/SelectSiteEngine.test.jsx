import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { spy } from 'sinon';

import SelectSiteEngine from '../frontend/components/SelectSiteEngine';

const expectedEngineValues = ['jekyll', 'hugo', 'static', 'node.js'];

describe('<SelectSiteEngine />', () => {
  const props = {
    id: 'hello',
    name: 'hello',
    value: expectedEngineValues[0],
    onChange: spy(),
  };

  beforeEach(() => {
    render(<SelectSiteEngine {...props} />);
  });

  it('renders a select element', () => {
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue(props.value);
  });

  it('calls props.onChange when a new option is selected', () => {
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: expectedEngineValues[2] } });
    expect(props.onChange.calledOnce);
  });
});
