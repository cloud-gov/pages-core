import SiteSettings from './settings';
import SiteBuildList from './builds';
import BuildLogs from './builds/$buildId/logs';
import PublishedBranchesTable from './published';
import PublishedFilesTable from './published/$name';
import DomainList from './custom-domains';
import NewCustomDomain from './custom-domains/new';
import EditCustomDomain from './custom-domains/$domainId/edit';
import Reports from './reports';
import FileStorage from './storage';
import { FileStorageLogs } from './storage/logs';
export default [
  {
    Component: DomainList,
    title: 'Custom Domains',
    path: 'custom-domains',
    icon: 'IconLink',
    showInSidebar: true,
  },
  {
    Component: NewCustomDomain,
    title: 'New Custom Domain',
    path: 'custom-domains/new',
  },
  {
    Component: EditCustomDomain,
    title: 'Edit custom domain',
    path: 'custom-domains/:domainId/edit',
  },
  {
    Component: SiteBuildList,
    title: 'Build history',
    path: 'builds',
    icon: 'IconBook',
    showInSidebar: true,
  },
  {
    Component: BuildLogs,
    title: 'Logs for build #',
    path: 'builds/:buildId/logs',
  },
  ...(process.env.FEATURE_BUILD_TASKS === 'true'
    ? [
        {
          Component: Reports,
          title: 'Report history',
          path: 'reports',
          icon: 'IconReport',
          showInSidebar: true,
        },
      ]
    : []),
  {
    Component: SiteSettings,
    title: 'Site settings',
    path: 'settings',
    icon: 'IconGear',
    showInSidebar: true,
  },
  {
    Component: FileStorage,
    title: 'Public file storage',
    path: 'storage',
    icon: 'IconCloudUpload',
    showInSidebar: true,
  },
  ...(process.env.FEATURE_FILE_STORAGE_SERVICE === 'true'
    ? [
        {
          Component: FileStorageLogs,
          title: 'Public storage file logs',
          path: 'storage/logs',
        },
      ]
    : []),
  {
    Component: PublishedBranchesTable,
    title: 'Site previews',
    path: 'published',
    icon: 'IconGlobe',
    showInSidebar: true,
  },
  {
    Component: PublishedFilesTable,
    title: 'Site preview',
    path: 'published/:name',
  },
];
