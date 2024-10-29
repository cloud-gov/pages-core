import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';
import { List } from '../../../../frontend/components/organization/List';

describe('<List />', () => {
  it('renders', () => {
    const props = {
      actions: {
        fetchOrganizationRoles: () => Promise.resolve(),
      },
    };

    const wrapper = shallow(<List {...props} />);

    expect(wrapper.contains(<h1 className="font-sans-2xl">Your organizations</h1>)).to.be
      .true;
  });

  it('shows the loading indicator when data is loading', () => {
    const props = {
      actions: {
        fetchOrganizationRoles: () => Promise.resolve(),
      },
    };

    const wrapper = shallow(<List {...props} />);

    expect(wrapper.contains(<LoadingIndicator />)).to.be.true;
  });
});
