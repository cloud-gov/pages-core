import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const alertActionUpdate = stub();
const Header = () => <div></div>;

const username = 'jenny mcuser';
const appState = {
  user: {
    username: username
  },
  alert: {}
};

const context = (state) => {
  return {
    state: {
      get: stub().returns(state)
    }
  };
};

const props = {
  location: {
    key: 'a-route'
  }
};

const AppFixture = proxyquire('../../../../assets/app/components/app', {
  '../store': {},
  '../actions/alertActions': { update: alertActionUpdate },
  './header': Header
}).default;

describe('<App/>', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<AppFixture {...props} />, { context: context(appState) });
    alertActionUpdate.reset();
  });

  it('renders its header component', () => {
    expect(wrapper.find(Header)).to.have.length(1);
  });

  it('delivers the correct props to the header', () => {
    const expectedProps = {
      username: username
    };
    const actualProps = wrapper.find(Header).props();

    expect(actualProps).to.deep.equal(expectedProps)
  });

  it('does not trigger an alert update if no alert message is present', () => {
    wrapper.setProps({location: {key: 'path'}});
    expect(alertActionUpdate.called).to.be.false;
  });

  it('does not trigger an alert update if the route has not changed', () => {
    const newAppState = Object.assign({}, appState, {
      alert: {
        message: 'hello!',
        stale: false
      }
    });

    wrapper = shallow(<AppFixture {...props}/>, {context: context(newAppState)});
    wrapper.setProps({location: {key: 'a-route'}});
    expect(alertActionUpdate.called).to.be.false;
  });

  it('triggers an alert update if there is an alert message', () => {
    const newAppState = Object.assign({}, appState, {
      alert: {
        message: 'hello!',
        stale: false
      }
    });

    wrapper = shallow(<AppFixture {...props}/>, {context: context(newAppState)});

    wrapper.setProps({location: {key: 'next-route'}});
    expect(alertActionUpdate.called).to.be.true;
    expect(alertActionUpdate.calledWith(newAppState.alert.stale)).to.be.true;
  });
});
