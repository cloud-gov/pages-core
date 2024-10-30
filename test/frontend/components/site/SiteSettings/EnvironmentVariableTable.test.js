import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import EnvironmentVariableTable from '../../../../../frontend/components/site/SiteSettings/EnvironmentVariableTable';

const stubs = {};

const uevs = [
  {
    id: 1,
    name: 'foo',
    hint: 'abcd',
  },
  {
    id: 2,
    name: 'bar',
    hint: '1234',
  },
];

describe('<EnvironmentVariableTable/>', () => {
  describe('renders', () => {
    let wrapper;

    beforeEach(() => {
      stubs.onDelete = sinon.stub();
      const props = {
        onDelete: stubs.onDelete,
        uevs,
      };
      wrapper = shallow(<EnvironmentVariableTable {...props} />);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('successfully', () => {
      expect(wrapper.exists()).to.be.true;
    });

    it('appropriate headers', () => {
      const headers = wrapper.find('thead tr th').map((n) => n.text());
      expect(headers).to.deep.equal(['Name', 'Value', 'Remove']);
    });

    describe('for each uev', () => {
      it('a row keyed by `id`', () => {
        const keys = wrapper.find('tbody tr').map((n) => Number(n.key()));
        expect(keys).to.deep.eq(uevs.map((uev) => uev.id));
      });

      it('including the `name`', () => {
        const names = wrapper.find('tbody tr').map((n) => n.find('th').first().text());
        expect(names).to.deep.eq(uevs.map((uev) => uev.name));
      });

      it('including the `hint` prefixed by "xxxx"', () => {
        const names = wrapper.find('tbody tr').map((n) => n.find('td').first().text());
        expect(names).to.deep.eq(uevs.map((uev) => `xxxx${uev.hint}`));
      });

      it('including a delete button that calls `onDelete` with the uev id', () => {
        const deleteButtons = wrapper
          .find('tbody tr')
          .map((n) => n.find('button').first());
        expect(deleteButtons.map((deleteButton) => deleteButton.text())).to.deep.eq([
          'Delete',
          'Delete',
        ]);

        deleteButtons.forEach((deleteButton) => deleteButton.simulate('click'));

        uevs.forEach((uev, idx) =>
          sinon.assert.calledWith(stubs.onDelete.getCall(idx), uev.id),
        );
      });
    });
  });
});
