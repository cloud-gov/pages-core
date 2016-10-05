import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const PageSettingsForm = () => <div></div>;
const Codemirror = () => <div></div>;

const onChange = stub();

describe('<PageSettings />', () => {
  const props = {
    frontmatter: 'title: squanch\npermalink: /about/\nimage: /assets/img/about.jpg\nlayout: page',
    templateConfig: 'layouts:\n  - projects\n  - page',
    onChange: onChange
  };
  const layouts = ['one', 'two'];

  const transformedProps = {
    initialFrontmatterContent: 'permalink: /about/\nimage: /assets/img/about.jpg\n'
  };

  const configuration = {
    permalink: '/about/',
    image: '/assets/img/about.jpg'
  };

  const fields = [{
    field: 'select'
  }, {
    field: 'input'
  }];

  let Fixture = proxyquire('../../../../../../../assets/app/components/site/editor/configs/pageSettings', {
       './pageSettingsForm': PageSettingsForm,
       './codemirror': Codemirror
     }).default;
  let wrapper;

  beforeEach(() => {


    wrapper = shallow(<Fixture {...props } />);
  });

  describe('child components', () => {
    it('includes a <PageSettingsForm/> component', () => {
      expect(wrapper.find(PageSettingsForm)).to.have.length(1);
    });

    it('includes a <Codemirror /> component', () => {
      expect(wrapper.find(Codemirror)).to.have.length(1);
    });
  });

  describe('child props', () => {
    it('delivers the correct props to <Codemirror/>', () => {
      const { initialFrontmatterContent } = wrapper.find(Codemirror).props();
      expect(initialFrontmatterContent).to.equal(transformedProps.initialFrontmatterContent);
    });

    it('delivers the correct props to <PageSettingsForm/>', () => {
      const { fields } = wrapper.find(PageSettingsForm).props();
      const inputField = fields.find(field => field.field === 'input');
      const selectField = fields.find(field => field.field === 'select');

      expect(inputField).to.not.be.undefined;
      expect(selectField).to.not.be.undefined;
      expect(selectField.props.value).to.equal('page');
      expect(inputField.props.value).to.equal('squanch');
    });
  });

  describe('change handler', () => {
    const updateText = 'paper';
    beforeEach(() => {
      wrapper.instance().handleChange(`layout:${updateText}`);
    });

    it('calls its onChange function from props when content is updated', () => {
      const { onChange } = wrapper.instance().props;
      wrapper.update();
      expect(onChange.calledOnce).to.be.true;
    });
  });
});
