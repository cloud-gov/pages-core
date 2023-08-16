## 0.2.0 (2023-08-16)

### Added

- Added site custom domains page | Updated domain model and admin | #4199

### Fixed

- Site serializer domain and branch config pick
- Fixed branchViewLink to use branch config and domain model #4032
- restore viewbox to svg icons for proper rendering

### Maintenance

- extend dependabot config to admin and metrics (#4217)
- add slack notification to release (#4216)
- update dependencies
- run dev tests in parallel with build, update dependabot (#4196)
- Build test webpack assets in non-version-controlled directory (#4191)
- add github release to production deploy (#4216)
- update deployment documentation
- correct release PR behavior (#4162)

## 0.1.0 (2023-08-02)

### Added

- Restructure site model with site branch config relation
- Add report of published sites per org and Reports admin menu item.
- Enable omission of search form in PaginatedQueryPage.

### Fixed

- Pages logo replaces Federalist logo in Pages Admin header (#4186)
- Remove dependencies on json-to-csv and abandoned json2csv version
- Move globals from frontend source files into ESLint config.
- Remove js-file-download dependency.

### Maintenance

- fix minor issues in release pipeline, gh status checks (#4162)
- create new production deployment on tag
- add automated release PRs
- Add nightly builds queue to bull board #4198
- Update nightly builds queue query #4198
- document use of conventional commits

## 0.0.0 (2023-07-19)

Work done prior to the release schedule