import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import GitHubRepoUrlField, {
  githubRepoUrl,
} from '../../../../frontend/components/Fields/GitHubRepoUrlField';

describe('<GitHubRepoUrlField />', () => {
  it('renders', () => {
    const props = {
      id: 'boopId',
      name: 'boopName',
      label: 'your label',
      help: <span>help me</span>,
    };

    const wrapper = shallow(<GitHubRepoUrlField {...props} />);
    expect(wrapper).not.to.be.undefined;
    expect(wrapper.find('Field[id="boopId"]')).to.have.length(1);
  });

  it('has validators specified', () => {
    const props = {
      id: 'boopId',
      name: 'boopName',
    };

    const wrapper = shallow(<GitHubRepoUrlField {...props} />);
    const validateProp = wrapper.props().validate;
    expect(validateProp.length).to.equal(1);
    expect(validateProp.indexOf(githubRepoUrl)).to.be.above(-1);
  });

  describe('githubRepoUrl validator', () => {
    it('validates', () => {
      const msg = 'URL is not formatted correctly';
      expect(githubRepoUrl()).to.be.undefined;
      expect(githubRepoUrl('')).to.be.undefined;

      expect(githubRepoUrl('anything')).to.equal(msg);
      expect(githubRepoUrl('https://example.com')).to.equal(msg);

      expect(githubRepoUrl('https://github.com/repo')).to.equal(msg);
      expect(githubRepoUrl('https://github.com/org/repo/')).to.equal(msg);
      expect(githubRepoUrl('https://github.com/org/repo*')).to.equal(msg);
      expect(githubRepoUrl('https://github.com/org/b')).to.equal(msg);

      expect(githubRepoUrl('https://github.com/org/repo')).to.be.undefined;
      expect(
        githubRepoUrl(
          'https://github.com/org_with-special_chars11/repo22_with-special_chars',
        ),
      ).to.be.undefined;
      expect(githubRepoUrl('https://github.com/org.with.periods/repo.com')).to.be
        .undefined;
    });
  });
});
