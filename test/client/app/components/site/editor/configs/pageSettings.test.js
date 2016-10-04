import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const PageSettingsForm = () => <div></div>;
const Codemirror = () => <div></div>;

const parseYaml = (string) => {
  return string.split('\n').reduce(function(memo, pair) {
    var keyValue = pair.split(':');
    memo[keyValue[0]] = keyValue[1];
    return memo;
  },{});
};

const writeYaml = (object) => {
  return Object.keys(object).reduce((memo, key) => {
    memo += `${key}:${object[key]}\n`;
    return memo;
  },'').trimRight();
};

const onChange = stub();

describe('<PageSettings />', () => {
  const props = {
    frontmatter: 'title:squanch\npermalink:/about/\nimage:/assets/img/about.jpg\nlayout:page',
    templateConfig: 'layouts:\n  - projects\n  - page',
    onChange: onChange
  };

  const Fixture = proxyquire('../../../../../../../assets/app/components/site/editor/configs/pageSettings', {
    './pageSettingsForm': PageSettingsForm,
    './codemirror': Codemirror,
    '../../../../util/parseYaml': { parseYaml, writeYaml }
  }).default;;

  const transformedProps = {
    initialFrontmatterContent: 'permalink:/about/\nimage:/assets/img/about.jpg'
  };

  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<Fixture {...props } />);
  });

  describe('state', () => {
    it('maintains a JS object of the frontmatter as internal state', () => {
      const state = wrapper.state();

      expect(state).not.to.equal(undefined);
      expect(state).to.deep.equal(parseYaml(props.frontmatter));
    });
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

    it('updates its internal state when handleChange is called', () => {
      wrapper.update();
      expect(wrapper.instance().state.layout).to.equal(updateText);
    });
  });
});
