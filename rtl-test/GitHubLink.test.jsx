import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import GitHubLink from '../frontend/components/GitHubLink';

describe('<GitHubLink/>', () => {
  it('renders', () => {
    const props = { owner: 'owner', repository: 'a-repo', text: 'link text' };
    render(<GitHubLink {...props} />);

    const anchor = screen.getByRole('link');
    expect(anchor).toHaveClass('repo-link');

    expect(anchor).toHaveAttribute('href', 'https://github.com/owner/a-repo');
    expect(anchor).toHaveAttribute('title', 'View repository on GitHub');
    expect(anchor).toHaveTextContent('link text');

    const icon = screen.getByTitle('icon-github');
    expect(icon).toBeInTheDocument();
  });

  // it('can link to a branch', () => {
  //   const props = {
  //    text: 'link text', owner: 'pumpkin-pie', repository: 'candle', branch: 'the-branch'
  // };
  //   const wrapper = shallow(<GitHubLink {...props} />).first().shallow();
  //   expect(wrapper.exists()).to.be.true;

  //   const anchor = wrapper.find('a.repo-link');
  //   expect(anchor.exists()).to.be.true;
  //   expect(anchor.prop('href')).to.equal('https://github.com/pumpkin-pie/candle/tree/the-branch');
  //   expect(anchor.prop('title')).to.equal('View branch');
  // });

  // it('encodes the branch name', () => {
  //   const props = { text: 'boop', owner: 'spam', repository: 'potato', branch: '#-hash-#' };
  //   const wrapper = shallow(<GitHubLink {...props} />).first().shallow();

  //   const anchor = wrapper.find('a.repo-link');
  //   expect(anchor.exists()).to.be.true;
  //   expect(anchor.prop('href')).to.equal('https://github.com/spam/potato/tree/%23-hash-%23');
  // });

  // it('links to a specific commit', () => {
  //   const props = { text: 'boop', owner: 'zookeeni', repository: 'veggies', sha: '123A' };
  //   const wrapper = shallow(<GitHubLink {...props} />).first().shallow();
  //   const commitUrl = `https://github.com/${props.owner}/${props.repository}/commit/${props.sha}`;
  //   const anchor = wrapper.find('a');

  //   expect(anchor.prop('href')).to.equal(commitUrl);
  // });

  // it('uses overrided title attribute if provided', () => {
  //   const props = {
  //   text: 'boop', owner: 'owner', repository: 'a-repo', title: 'handy explanation'
  // };
  //   const wrapper = shallow(<GitHubLink {...props} />);

  //   expect(wrapper.prop('title')).to.equal(props.title);
  // });
});
