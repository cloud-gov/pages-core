import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import GitHubRepoUrlField, { githubRepoUrl } from '../../../frontend/components/GitHubRepoUrlField';
import RenderField from '../../../frontend/components/GitHubRepoUrlField/RenderField';

describe('<GitHubRepoUrlField />', () => {
  it('renders', () => {
    const props = {
      id: 'boopId',
      name: 'boopName',
    };

    const wrapper = shallow(<GitHubRepoUrlField {...props} />);
    expect(wrapper).to.be.defined;
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
    expect(validateProp.find(githubRepoUrl)).to.not.be.null;
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
      expect(githubRepoUrl('https://github.com/org_with-special_chars11/repo22_with-special_chars')).to.be.undefined;
    });
  });
});

describe('GitHubRepoUrlField <RenderField />', () => {
  it('renders', () => {
    const props = {
      id: 'anId',
      input: { },
      name: 'aName',
      meta: { touched: false, error: null },
    };

    const wrapper = shallow(<RenderField {...props} />);
    expect(wrapper).to.be.defined;
    expect(wrapper.find('input[id="anId"][type="url"]')).to.have.length(1);
  });

  it('displays validation errors', () => {
    const props = {
      id: 'anId',
      input: { },
      name: 'aName',
      meta: { touched: false, error: null },
    };

    let wrapper = shallow(<RenderField {...props} />);
    expect(wrapper.find('.usa-input-error')).to.have.length(0);
    expect(wrapper.find('.usa-input-error-message')).to.have.length(0);

    props.meta.error = 'boop error';
    // touched is still false, so no errors should be shown
    wrapper = shallow(<RenderField {...props} />);
    expect(wrapper.find('.usa-input-error')).to.have.length(0);
    expect(wrapper.find('.usa-input-error-message')).to.have.length(0);

    props.meta.touched = true;
    // now that both touched and error have been set,
    // the error should be shown
    wrapper = shallow(<RenderField {...props} />);
    expect(wrapper.find('.usa-input-error')).to.have.length(1);
    expect(wrapper.find('.usa-input-error-message')).to.have.length(1);
    expect(wrapper.find('.usa-input-error-message').text()).to.equal('boop error');
  });
});
