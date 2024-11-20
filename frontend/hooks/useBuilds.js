import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import api from '@util/federalistApi';
import { REFETCH_INTERVAL, shouldScrollIntoView } from './utils';

// Assumes the order of builds is based on createdAt desc
export function getLatestBuildByBranch(builds) {
  const latestBranches = [];

  return builds.map((build) => {
    if (build.completedAt && !latestBranches.includes(build.branch)) {
      latestBranches.push(build.branch);
      return { ...build, latestForBranch: true };
    }

    return { ...build, latestForBranch: false };
  });
}

export function useBuilds(siteId) {
  const { data, error, isPending, isPlaceholderData } = useQuery({
    placeholderData: [],
    queryKey: ['builds', parseInt(siteId, 10)],
    queryFn: () =>
      api.fetchBuilds({ id: siteId }).then((builds) => getLatestBuildByBranch(builds)),
    refetchInterval: REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
  });

  return { data, error, isPending, isPlaceholderData };
}

export function useRebuild(siteId, buildId, ref) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ buildId, siteId }) => api.restartBuild(buildId, siteId),
    onSuccess: () => {
      // Scroll to build history container ref
      // Invalidate and refetch
      return Promise.all([
        shouldScrollIntoView(ref),
        queryClient.invalidateQueries({
          queryKey: ['builds', parseInt(siteId, 10)],
        }),
      ]);
    },
  });

  async function rebuildBranch() {
    return mutation.mutate({
      buildId,
      siteId,
    });
  }

  return {
    ...mutation,
    queryClient,
    rebuildBranch,
  };
}
