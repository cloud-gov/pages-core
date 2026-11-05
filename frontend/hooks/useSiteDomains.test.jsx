import { waitFor, renderHook, act } from '@testing-library/react';
import api from '../util/federalistApi';
import { useSiteDomain } from './useSiteDomains';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../util/federalistApi', () => ({
  fetchSiteBranchConfigs: jest.fn(),
  fetchSiteDomains: jest.fn(),
  updateSiteDomain: jest.fn(),
}));

const siteId = 1;
const domainId = 2;
const pendingDomain = {
  id: domainId,
  siteId,
  names: 'www.agency.gov',
  siteBranchConfigId: 10,
  state: 'pending',
};

describe('useSiteDomain', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(api.fetchSiteBranchConfigs).mockResolvedValue([{ id: 10 }]);
    jest.mocked(api.fetchSiteDomains).mockResolvedValue([pendingDomain]);
  });

  async function renderLoaded() {
    const view = renderHook(() => useSiteDomain(siteId, domainId));
    await waitFor(() => expect(view.result.current.domain.data).toEqual(pendingDomain));
    await waitFor(() => expect(view.result.current.availableConfigs).not.toHaveLength(0));
    return view;
  }

  describe('updateSiteDomain', () => {
    it('sets an error message when the update returns no result', async () => {
      jest.mocked(api.updateSiteDomain).mockResolvedValue(undefined);
      const { result } = await renderLoaded();

      await act(() => result.current.updateSiteDomain());

      expect(result.current.domain.error).toBe('Unable to update domain www.agency.gov');
    });

    it('sets an error message when the update fails', async () => {
      jest.mocked(api.updateSiteDomain).mockRejectedValue(new Error('Update failed'));
      const { result } = await renderLoaded();

      await act(() => result.current.updateSiteDomain());

      expect(result.current.domain.error).toBe('Update failed');
    });
  });
});
