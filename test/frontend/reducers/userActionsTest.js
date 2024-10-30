import { expect } from 'chai';
import userActions from '../../../frontend/reducers/userActions';
import {
  userActionFetchStartedType,
  userActionReceivedType,
} from '../../../frontend/actions/actionCreators/userActions';

describe('userActions reducer', () => {
  it('returns a default and ignores undefined actions', () => {
    const actual = userActions(undefined, {
      type: 'NOT_ACCEPTED_ACTION',
    });

    expect(actual).to.deep.equal({
      isLoading: false,
      data: [],
    });
  });

  it('sets `isLoading` prop to true when fetch begins', () => {
    const existingData = {
      isLoading: false,
      data: [],
    };

    const actual = userActions(existingData, {
      type: userActionFetchStartedType,
    });

    expect(actual).to.deep.equal({
      isLoading: true,
      data: existingData.data,
    });
  });

  it('sets `isLoading` prop to false and populates new data when fetch ends', () => {
    const firstState = ['a', 'b'];
    const nextState = ['c', 'd'];

    const actual = userActions(
      {
        isLoading: true,
        data: firstState,
      },
      {
        type: userActionReceivedType,
        userActions: nextState,
      },
    );

    expect(actual).to.deep.equal({
      isLoading: false,
      data: nextState,
    });
  });
});
