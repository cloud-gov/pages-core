import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import SiteBuildLogTable from '../../../../frontend/components/site/siteBuildLogTable';

describe('<SiteBuildLogTable/>', () => {
  it('should render a table of build logs', () => {
    const props = {
      buildLogs: ['2017-06-19T14:45:12.126Z', '2017-06-19T14:50:44.336Z'],
    };

    const wrapper = shallow(<SiteBuildLogTable {...props} />);
    const el = wrapper.find('.build-log');
    expect(el).to.have.length(1);
    expect(el.contains('2017-06-19T14:45:12.126Z')).to.be.true;
    expect(el.contains('2017-06-19T14:50:44.336Z')).to.be.true;
  });
});
