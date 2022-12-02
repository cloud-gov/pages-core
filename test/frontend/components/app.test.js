import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';
import { MemoryRouter } from 'react-router-dom';

proxyquire.noCallThru();

const alertActionUpdate = stub();
const buildStatusNotifierListen = stub();
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
  notifier: {
    listen: buildStatusNotifierListen,
  },
};

const AppFixture = proxyquire('../../../frontend/components/app', {
  '../store': {},
  '../actions/alertActions': { update: alertActionUpdate },
  './header': Header,
}).App;

const shallowRouter = elem => shallow(<MemoryRouter>{elem}</MemoryRouter>);

describe('<App/>', () => {
  let wrapper;

  beforeEach(() => {
    // TODO: need to figure out the store mocking here and refactor these
    wrapper = shallowRouter(<AppFixture {...props} />);
    alertActionUpdate.reset();
    buildStatusNotifierListen.reset();
  });

  it('does not trigger an alert update if no alert message is present', () => {
    wrapper.setProps({ location: { key: 'path' } });
    expect(alertActionUpdate.called).to.be.false;
    expect(buildStatusNotifierListen.called).to.be.false;
  });

  it('does not trigger an alert update if the route has not changed', () => {
    const newProps = {
      ...props,
      alert: {
        message: 'hello!',
        stale: false,
      },
    };

    wrapper = shallowRouter(<AppFixture {...newProps} />);
    wrapper.setProps({ location: { key: 'a-route' } });
    expect(alertActionUpdate.called).to.be.false;
    expect(buildStatusNotifierListen.called).to.be.true;
  });

  it('triggers an alert update if there is an alert message', () => {
    const newProps = {
      ...props,
      alert: {
        message: 'hello!',
        stale: false,
      },
    };

    wrapper = shallowRouter(<AppFixture {...newProps} />);

    wrapper.setProps({ location: { key: 'next-route' } });
    expect(alertActionUpdate.called).to.be.true;
    expect(alertActionUpdate.calledWith(newProps.alert.stale)).to.be.true;
    expect(buildStatusNotifierListen.called).to.be.true;
  });

  it('subscribes to build status events on mount', () => {
    shallowRouter(<AppFixture {...props} />);

    expect(buildStatusNotifierListen.called).to.be.true;
  });
});
