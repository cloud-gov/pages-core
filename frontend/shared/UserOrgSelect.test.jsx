import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { spy } from 'sinon';
import { createFixtureOrg } from '../../test/frontend/support/data/organizations';

import UserOrgSelect from './UserOrgSelect';

const id = 'hello-select';
const label = 'Hello World';
const name = 'select-name';
const org1 = createFixtureOrg({ name: 'org-1' });
const org2 = createFixtureOrg({ name: 'org-2' });
const value = '';
const initialProps = {
  className: '',
  id,
  label,
  touched: false,
  error: null,
  mustChooseOption: false,
  name,
  onChange: spy(),
  orgData: [org1, org2],
  value,
};

describe('<UserOrgSelect />', () => {
  it('renders a select element', () => {
    render(<UserOrgSelect {...initialProps} />);
    expect(screen.getByLabelText(label)).toBeTruthy();
    expect(screen.queryByText('Please select an organization')).toBeFalsy();
    expect(screen.getByText(org1.name)).toBeTruthy();
    expect(screen.getByText(org2.name)).toBeTruthy();

    const select = screen.getByRole('combobox');
    const calledWith = { target: { value: org1.id } };
    fireEvent.change(select, calledWith);
    expect(initialProps.onChange.calledOnce).toBeTruthy();
  });

  it('renders a select element with a must choose option', () => {
    const mustChooseOption = 'Please select an organization';
    const props = { ...initialProps, mustChooseOption: true };

    render(<UserOrgSelect {...props} />);
    expect(screen.getByLabelText(label)).toBeTruthy();
    expect(screen.getByText(mustChooseOption)).toBeTruthy();
  });

  it('renders an error', () => {
    const error = 'This is an error';
    const props = { ...initialProps, error, touched: true };

    render(<UserOrgSelect {...props} />);
    expect(screen.getByText(error)).toBeTruthy();
    expect(screen.getByLabelText(label)).toBeTruthy();
  });
});
