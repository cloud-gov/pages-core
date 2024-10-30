import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import ReduxFormBasicAuthSettingsForm, {
  BasicAuthSettingsForm,
} from '../../../../../frontend/components/site/SiteSettings/BasicAuthSettingsForm';

const stubs = {};

describe('<BasicAuthSettingsForm/>', () => {
  it('exports a ReduxForm-connected component', () => {
    expect(ReduxFormBasicAuthSettingsForm).to.not.be.null;
  });

  describe('renders', () => {
    let defaultProps;

    beforeEach(() => {
      stubs.handleSubmit = sinon.stub();
      stubs.handleSubmit.resolves();
      stubs.reset = sinon.stub();
      defaultProps = {
        handleSubmit: stubs.handleSubmit,
        pristine: true,
        submitting: false,
      };
    });

    afterEach(() => {
      sinon.restore();
    });

    it('successfully', () => {
      const wrapper = shallow(<BasicAuthSettingsForm {...defaultProps} />);
      expect(wrapper.exists()).to.be.true;
    });

    it('a `username` Field', () => {
      const wrapper = shallow(<BasicAuthSettingsForm {...defaultProps} />);
      expect(
        wrapper.find({
          name: 'username',
        }),
      ).to.have.lengthOf(1);
    });

    it('a `password` Field', () => {
      const wrapper = shallow(<BasicAuthSettingsForm {...defaultProps} />);
      expect(
        wrapper.find({
          name: 'password',
        }),
      ).to.have.lengthOf(1);
    });

    it('a disabled submit button', () => {
      const wrapper = shallow(<BasicAuthSettingsForm {...defaultProps} />);
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton).to.have.lengthOf(1);
      expect(submitButton.first().prop('disabled')).to.be.true;
    });

    it('an enabled submit button', () => {
      const props = {
        ...defaultProps,
      };
      props.initialValues = {
        username: 'username',
        password: 'password',
      };
      props.pristine = false;
      const wrapper = shallow(<BasicAuthSettingsForm {...props} />);
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton).to.have.lengthOf(1);
      expect(submitButton.first().prop('disabled')).to.be.false;
    });

    it('an disabled submit button due to invalid username', () => {
      const props = {
        ...defaultProps,
      };
      props.initialValues = {
        username: 'use',
        password: 'password',
      };
      props.pristine = false;
      const wrapper = shallow(<BasicAuthSettingsForm {...props} />);
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton).to.have.lengthOf(1);
      expect(submitButton.first().prop('disabled')).to.be.false;
    });

    it('an disabled submit button due to invalid password', () => {
      const props = {
        ...defaultProps,
      };
      props.initialValues = {
        username: 'username',
        password: 'passw',
      };
      props.pristine = false;
      const wrapper = shallow(<BasicAuthSettingsForm {...props} />);
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton).to.have.lengthOf(1);
      expect(submitButton.first().prop('disabled')).to.be.false;
    });

    describe('when `submitting` is true', () => {
      it('a disabled submit button', () => {
        const props = {
          ...defaultProps,
          submitting: true,
        };
        const wrapper = shallow(<BasicAuthSettingsForm {...props} />);
        const submitButton = wrapper.find('button[type="submit"]');
        expect(submitButton).to.have.lengthOf(1);
        expect(submitButton.first().prop('disabled')).to.be.true;
      });
    });

    it('calls `handleSubmit` when submitted', () => {
      const wrapper = shallow(<BasicAuthSettingsForm {...defaultProps} />);
      const form = wrapper.find('form').first();
      form.simulate('submit');
      sinon.assert.called(stubs.handleSubmit);
    });
  });
});
