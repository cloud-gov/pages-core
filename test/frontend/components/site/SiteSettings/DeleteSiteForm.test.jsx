import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

import ReduxFormDeleteForm, {
  DeleteSiteForm,
} from '../../../../../frontend/components/site/SiteSettings/DeleteSiteForm';

describe('<DeleteSiteForm/>', () => {
  it('should export a ReduxForm-connected component', () => {
    expect(ReduxFormDeleteForm).to.not.be.null;
  });

  describe('given default props', () => {
    const makeProps = () => ({
      handleSubmit: spy(),
      siteId: 1,
      submitting: false,
    });

    let props;
    let wrapper;
    beforeEach(() => {
      props = makeProps();
      wrapper = shallow(<DeleteSiteForm {...props} />);
    });

    it('should render', () => {
      expect(wrapper.exists()).to.be.true;
    });

    it('should render alert banner', () => {
      const alertBanner = wrapper.find('AlertBanner');
      expect(alertBanner).to.have.length(1);
      expect(alertBanner.prop('header')).not.to.be.undefined;
      expect(alertBanner.prop('message')).not.to.be.undefined;
      expect(alertBanner.prop('alertRole')).to.be.false;
    });

    it('renders delete button as enabled', () => {
      const deleteButton = wrapper.find('button[type="submit"]');
      expect(deleteButton.prop('disabled')).to.not.be.ok;
    });

    it('should call handleSubmit when submitted', () => {
      expect(props.handleSubmit.called).to.be.false;
      wrapper.find('form').simulate('submit');
      expect(props.handleSubmit.calledOnce).to.be.true;
    });
  });

  it('should render delete button as disabled when submitting', () => {
    const props = {
      siteId: 1,
      submitting: true,
      handleSubmit: spy(),
    };
    const wrapper = shallow(<DeleteSiteForm {...props} />);

    const deleteButton = wrapper.find('button[type="submit"]');
    expect(deleteButton.prop('disabled')).to.be.true;
  });
});
