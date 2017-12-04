import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import GitHubURLProvider from '../../../../frontend/components/GitHubLink/GitHubURLProvider';

describe('<GitHubURLProvider/>', () => {
  it('provides a `baseHref` to wrapped component', () => {
    const props = { owner: 'owner', repository: 'repo' };
    const Component = GitHubURLProvider(({ baseHref }) => <div baseHref={baseHref} />);
    const wrapper = shallow(<Component {...props} />).first();

    expect(wrapper.props().baseHref).to.equal(`https://github.com/${props.owner}/${props.repository}`);
  });
});
