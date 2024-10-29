import React from 'react';
import { expect } from 'chai';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';

import { mountRouter } from '../support/_mount';

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
  path: '/',
};

const AppFixture = proxyquire('../../../frontend/components/app', {
  '../actions/alertActions': {
    update: alertActionUpdate,
  },
  '../util/buildStatusNotifier': class Test {},
}).App;

describe('<App/>', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mountRouter(<AppFixture {...props} />);
    alertActionUpdate.reset();
    buildStatusNotifierListen.reset();
  });

  // TODO: rewrite in new testing framework
  // it('renders children', () => {
  //   const newProps = {
  //     ...props,
  //     children: (<div id="app-child">child!</div>),
  //   };
  //   wrapper = mountRouter(<AppFixture {...newProps} />);
  //   expect(wrapper.find('LoadingIndicator')).to.have.length(0);
  //   expect(wrapper.find('#app-child')).to.have.length(1);
  // });

  it('does not trigger an alert update if no alert message is present', () => {
    wrapper.setProps({
      location: {
        key: 'path',
      },
    });
    expect(alertActionUpdate.called).to.be.false;
  });

  // TODO: rewrite in new testing framework
  // it('does not trigger an alert update if the route has not changed', () => {
  //   const newProps = {
  //     ...props,
  //     alert: {
  //       message: 'hello!',
  //       stale: false,
  //     },
  //   };

  //   wrapper = mountRouter(<AppFixture {...newProps} />);
  //   wrapper.setProps({ location: { key: 'a-route' } });
  //   expect(alertActionUpdate.called).to.be.false;
  // });

  it('triggers an alert update if there is an alert message', () => {
    const newProps = {
      ...props,
      alert: {
        message: 'hello!',
        stale: false,
      },
    };

    wrapper = mountRouter(<AppFixture {...newProps} />);

    wrapper.setProps({
      location: {
        key: 'next-route',
      },
    });
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
