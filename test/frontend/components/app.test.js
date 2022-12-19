import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';
import { LocationProvider } from '@reach/router';

import mountRouter from '../support/_mount';

proxyquire.noCallThru();

const alertActionUpdate = stub();
const buildStatusNotifierListen = stub();
const onEnter = stub();

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
  notifier: {
    listen: buildStatusNotifierListen,
  },
  onEnter,
};

const AppFixture = proxyquire('../../../frontend/components/app', {
  '../actions/alertActions': { update: alertActionUpdate },
  '../util/buildStatusNotifier': class Test {},
}).App;

const shallowRouter = elem => shallow(<LocationProvider>{elem}</LocationProvider>).dive();

describe('<App/>', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallowRouter(<AppFixture {...props} />);
    alertActionUpdate.reset();
    buildStatusNotifierListen.reset();
  });

  it('renders children', () => {
    const newProps = {
      ...props,
      children: (<div id="app-child">child!</div>),
    };
    wrapper = shallowRouter(<AppFixture {...newProps} />);

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(wrapper.find('#app-child')).to.have.length(1);
  });

  it('does not trigger an alert update if no alert message is present', () => {
    wrapper.setProps({ location: { key: 'path' } });
    expect(alertActionUpdate.called).to.be.false;
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
  });

  it('triggers an alert update if there is an alert message', () => {
    const newProps = {
      ...props,
      alert: {
        message: 'hello!',
        stale: false,
      },
    };

    wrapper = mountRouter(<AppFixture {...newProps} />);

    wrapper.setProps({ location: { key: 'next-route' } });
    expect(alertActionUpdate.called).to.be.true;
    expect(alertActionUpdate.calledWith(newProps.alert.stale)).to.be.true;
  });

  it('calls onEnter on mount', () => {
    mountRouter(<AppFixture {...props} />);

    expect(onEnter.called).to.be.true;
  });

  it('subscribes to build status events on mount', () => {
    mountRouter(<AppFixture {...props} />);

    expect(buildStatusNotifierListen.called).to.be.true;
  });
});
