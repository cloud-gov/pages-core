/* global describe test expect beforeEach */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { BranchViewLink } from '../frontend/components/branchViewLink';

describe('<BranchViewLink/>', () => {
  const testSite = {
    defaultBranch: 'default-branch',
    demoBranch: 'demo-branch',
    domain: 'https://prod-url.com',
    demoDomain: 'https://demo-url.com',
    owner: 'test-owner',
    repository: 'test-repo',
    awsBucketName: 'test-bucket',
    s3ServiceName: 'federalist-production-s3',
  };

  let props;

  beforeEach(() => {
    props = {
      branchName: 'branch-name',
      site: testSite,
    };
  });

  test('it renders a link to the default branch\'s site', () => {
    props.branchName = 'default-branch';
    props.viewLink = 'https://some-domain.gov/';
    render(<BranchViewLink {...props} />);

    const link = screen.queryByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://some-domain.gov/');
    expect(link).toHaveTextContent('View site');
  });

  // it('renders a link to the demo branch\'s site', () => {
  //   props.branchName = 'demo-branch';
  //   props.viewLink = 'https://some-other-domain.gov/';
  //   const wrapper = shallow(<BranchViewLink {...props} />);
  //   const anchor = wrapper.find('a');
  //   expect(anchor.length).to.equal(1);
  //   expect(anchor.prop('href')).to.equal('https://some-other-domain.gov/');
  //   expect(anchor.text()).equal('View demo');
  // });

  // it('renders a preview link to the other branches', () => {
  //   props.branchName = 'some-other-branch';
  //   props.viewLink = 'https://random-url.com/';
  //   const wrapper = shallow(<BranchViewLink {...props} />);
  //   const anchor = wrapper.find('a');
  //   expect(anchor.length).to.equal(1);
  //   expect(anchor.prop('href')).to.equal('https://random-url.com/');
  //   expect(anchor.text()).equal('Preview site');
  // });

  // it('allows some special characters', () => {
  //   props.branchName = 'release_1.2.3';
  //   props.viewLink = 'https://release_1.2.3.gov/';
  //   const wrapper = shallow(<BranchViewLink {...props} />);
  //   const anchor = wrapper.find('a');
  //   expect(anchor.length).to.equal(1);
  //   expect(anchor.prop('href')).to.equal('https://release_1.2.3.gov/');
  //   expect(anchor.text()).equal('Preview site');
  // });
});
