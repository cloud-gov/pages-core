import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import ReduxFormEnvironmentVariableForm, {
  EnvironmentVariableForm,
} from '../../../../../frontend/components/site/SiteSettings/EnvironmentVariableForm';

const stubs = {};

describe('<EnvironmentVariableForm/>', () => {
  it('exports a ReduxForm-connected component', () => {
    expect(ReduxFormEnvironmentVariableForm).to.not.be.null;
  });

  describe('renders', () => {
    let defaultProps;

    beforeEach(() => {
      stubs.handleSubmit = sinon.stub();
      stubs.handleSubmit.resolves();
      stubs.reset = sinon.stub();
      defaultProps = {
        handleSubmit: stubs.handleSubmit,
        invalid: false,
        reset: stubs.reset,
        pristine: true,
        submitting: false,
      };
    });

    afterEach(() => {
      sinon.restore();
    });

    it('successfully', () => {
      const wrapper = shallow(<EnvironmentVariableForm {...defaultProps} />);
      expect(wrapper.exists()).to.be.true;
    });

    it('a `name` Field', () => {
      const wrapper = shallow(<EnvironmentVariableForm {...defaultProps} />);
      expect(
        wrapper.find({
          name: 'name',
        }),
      ).to.have.lengthOf(1);
    });

    it('a `value` Field', () => {
      const wrapper = shallow(<EnvironmentVariableForm {...defaultProps} />);
      expect(
        wrapper.find({
          name: 'value',
        }),
      ).to.have.lengthOf(1);
    });

    it('an enabled submit button', () => {
      const wrapper = shallow(<EnvironmentVariableForm {...defaultProps} />);
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton).to.have.lengthOf(1);
      expect(submitButton.first().prop('disabled')).to.be.false;
    });

    it('a disabled clear button', () => {
      const wrapper = shallow(<EnvironmentVariableForm {...defaultProps} />);
      const clearButton = wrapper.find('button[type="button"]');
      expect(clearButton).to.have.lengthOf(1);
      expect(clearButton.first().text()).to.eq('Clear');
      expect(clearButton.first().prop('disabled')).to.be.true;
    });

    describe('when `pristine` is false', () => {
      it('a enabled clear button', () => {
        const props = {
          ...defaultProps,
          pristine: false,
        };
        const wrapper = shallow(<EnvironmentVariableForm {...props} />);
        const clearButton = wrapper.find('button[type="button"]');
        expect(clearButton).to.have.lengthOf(1);
        expect(clearButton.first().text()).to.eq('Clear');
        expect(clearButton.first().prop('disabled')).to.be.false;
      });
    });

    describe('when `submitting` is true', () => {
      it('a disabled submit button', () => {
        const props = {
          ...defaultProps,
          submitting: true,
        };
        const wrapper = shallow(<EnvironmentVariableForm {...props} />);
        const submitButton = wrapper.find('button[type="submit"]');
        expect(submitButton).to.have.lengthOf(1);
        expect(submitButton.first().prop('disabled')).to.be.true;
      });

      describe('and `pristine` is true', () => {
        it('a disabled clear button', () => {
          const props = {
            ...defaultProps,
            submitting: true,
          };
          const wrapper = shallow(<EnvironmentVariableForm {...props} />);
          const clearButton = wrapper.find('button[type="button"]');
          expect(clearButton).to.have.lengthOf(1);
          expect(clearButton.first().text()).to.eq('Clear');
          expect(clearButton.first().prop('disabled')).to.be.true;
        });
      });

      describe('and `pristine` is false', () => {
        it('a disabled clear button', () => {
          const props = {
            ...defaultProps,
            submitting: true,
            pristine: false,
          };
          const wrapper = shallow(<EnvironmentVariableForm {...props} />);
          const clearButton = wrapper.find('button[type="button"]');
          expect(clearButton).to.have.lengthOf(1);
          expect(clearButton.first().text()).to.eq('Clear');
          expect(clearButton.first().prop('disabled')).to.be.true;
        });
      });
    });

    it('calls `handleSubmit` when submitted', () => {
      const wrapper = shallow(<EnvironmentVariableForm {...defaultProps} />);
      const form = wrapper.find('form').first();
      form.simulate('submit');
      sinon.assert.called(stubs.handleSubmit);
    });

    it('calls `reset` when cleared', () => {
      const wrapper = shallow(<EnvironmentVariableForm {...defaultProps} />);
      const clearButton = wrapper.find('button[type="button"]');
      expect(clearButton).to.have.lengthOf(1);
      expect(clearButton.first().text()).to.eq('Clear');
      clearButton.first().simulate('click');
      sinon.assert.called(stubs.reset);
    });
  });
});
