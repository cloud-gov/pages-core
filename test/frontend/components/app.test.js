import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const alertActionUpdate = stub();
const buildStatusNotifierListen = stub();
const onEnter = stub();
const Header = () => <div />;

const username = 'jenny mcuser';

const props = {
  alert: {},
  user: {
    data: {
      username,
      createdAt: '2016-09-15',
      updatedAt: '2017-10-12',
      email: 'user@example.gov',
      id: 123,
    },
    isLoading: false,
  },
  location: {
    key: 'a-route',
  },
  onEnter,
};

const AppFixture = proxyquire('../../../frontend/components/app', {
  '../store': {},
  '../actions/alertActions': { update: alertActionUpdate },
  './header': Header,
  '../util/buildStatusNotifier': { listen: buildStatusNotifierListen },
}).App;

describe('<App/>', () => {
  let wrapper;

  beforeEach(() => {
    // TODO: need to figure out the store mocking here and refactor these
    wrapper = shallow(<AppFixture {...props} />);
    alertActionUpdate.reset();
    buildStatusNotifierListen.reset();
  });

  it('renders children', () => {
    const newProps = Object.assign({}, props, {
      children: (<div id="app-child">child!</div>),
    });
    wrapper = shallow(<AppFixture {...newProps} />);

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(wrapper.find('#app-child')).to.have.length(1);
    expect(buildStatusNotifierListen.called).to.be.true;
  });

  it('does not trigger an alert update if no alert message is present', () => {
    wrapper.setProps({ location: { key: 'path' } });
    expect(alertActionUpdate.called).to.be.false;
    expect(buildStatusNotifierListen.called).to.be.false;
  });

  it('does not trigger an alert update if the route has not changed', () => {
    const newProps = Object.assign({}, props, {
      alert: {
        message: 'hello!',
        stale: false,
      },
    });

    wrapper = shallow(<AppFixture {...newProps} />);
    wrapper.setProps({ location: { key: 'a-route' } });
    expect(alertActionUpdate.called).to.be.false;
    expect(buildStatusNotifierListen.called).to.be.true;
  });

  it('triggers an alert update if there is an alert message', () => {
    const newProps = Object.assign({}, props, {
      alert: {
        message: 'hello!',
        stale: false,
      },
    });

    wrapper = shallow(<AppFixture {...newProps} />);

    wrapper.setProps({ location: { key: 'next-route' } });
    expect(alertActionUpdate.called).to.be.true;
    expect(alertActionUpdate.calledWith(newProps.alert.stale)).to.be.true;
    expect(buildStatusNotifierListen.called).to.be.true;
  });

  it('renders a loading indicator when the user is loading', () => {
    const newProps = Object.assign({}, props, {
      user: { isLoading: true, data: null },
    });

    wrapper = shallow(<AppFixture {...newProps} />);
    expect(wrapper.find('LoadingIndicator')).to.have.length(1);
    expect(buildStatusNotifierListen.called).to.be.true;
  });

  it('calls onEnter on mount', () => {
    shallow(<AppFixture {...props} />);

    expect(onEnter.called).to.be.true;
  });

  it('subscribes to build status events on mount', () => {
    shallow(<AppFixture {...props} />);

    expect(buildStatusNotifierListen.called).to.be.true;
  });
});
