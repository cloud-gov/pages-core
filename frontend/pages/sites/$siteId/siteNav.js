export default {
  // within SiteContainer
  DomainList: {
    title: 'Custom Domains',
    path: 'custom-domains',
    icon: 'IconLink',
    showInSidebar: true,
  },
  NewCustomDomain: {
    title: 'New Custom Domain',
    path: 'custom-domains/new',
  },
  EditCustomDomain: {
    title: 'Edit custom domain',
    path: 'custom-domains/:domainId/edit',
  },
  SiteBuildList: {
    title: 'Build history',
    path: 'builds',
    icon: 'IconBook',
    showInSidebar: true,
  },
  BuildLogs: {
    title: 'Logs for build #',
    path: 'builds/:buildId/logs',
  },
  Reports: {
    title: 'Report history',
    path: 'reports',
    icon: 'IconReport',
    showInSidebar: true,
  },
  SiteSettings: {
    title: 'Site settings',
    path: 'settings',
    icon: 'IconGear',
    showInSidebar: true,
  },
  ...(process.env.FEATURE_FILE_STORAGE_SERVICE && {
    FileStorage: {
      title: 'Public storage',
      path: 'storage',
      icon: 'IconAttachment',
      showInSidebar: true,
    },
    FileStorageLog: {
      title: 'Public storage',
      path: 'storage/logs',
    },
  }),
  PublishedBranches: {
    title: 'Published builds',
    path: 'published',
    icon: 'IconCloudUpload',
    showInSidebar: true,
  },
  PublishedFiles: {
    title: 'Published build',
    path: 'published/:name',
  },
};
