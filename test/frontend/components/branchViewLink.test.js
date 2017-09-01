import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { BranchViewLink } from '../../../frontend/components/branchViewLink';

describe('<BranchViewLink/>', () => {
  const testSite = {
    defaultBranch: 'default-branch',
    demoBranch: 'demo-branch',
    viewLink: 'https://prod-url.com',
    demoViewLink: 'https://demo-url.com',
    owner: 'test-owner',
    repository: 'test-repo',
  };

  let props;

  beforeEach(() => {
    props = {
      branchName: 'branch-name',
      site: testSite,
      previewHostname: 'https://preview-hostname.com',
    };
  });

  it('does not link an unlinkable branch name', () => {
    props.branchName = 'abc-#-def';
    const wrapper = shallow(<BranchViewLink {...props} />);
    expect(wrapper.find('span').length).to.equal(1);
    expect(wrapper.find('span').text()).to.equal('Unlinkable branch name');
  });

  it('renders a link to the default branch\'s site', () => {
    props.branchName = 'default-branch';
    const wrapper = shallow(<BranchViewLink {...props} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal('https://prod-url.com');
    expect(anchor.text()).equal('View site');
  });

  it('renders a link to the demo branch\'s site', () => {
    props.branchName = 'demo-branch';
    const wrapper = shallow(<BranchViewLink {...props} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal('https://demo-url.com');
    expect(anchor.text()).equal('View demo');
  });

  it('renders a preview link to the other branches', () => {
    props.branchName = 'some-other-branch';
    const wrapper = shallow(<BranchViewLink {...props} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal(
      'https://preview-hostname.com/preview/test-owner/test-repo/some-other-branch/');
    expect(anchor.text()).equal('View preview');
  });
});
