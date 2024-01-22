## 0.5.3 (2024-01-22)

### Fixed

- **ci**: Remove erroneous container params in stage/prod
- **ci**: Run db migrations in CI task container with SSL #4354

### Maintenance

- Run build log archive job in dev and staging as well #4367
- Add Dev and Staging section to OPERATIONS.md, starting with manual migrations #4366
- Make Build a paranoid model (enable soft deletion) #4366
- Remove isActive from User #4338

## 0.5.2 (2023-12-21)

### Maintenance

- Fix build task feature flag

## 0.5.1 (2023-12-20)

### Maintenance

- reimplement build task feature flag handling

## 0.5.0 (2023-12-20)

### Added

- add build task ui (#4171)
- **admin**: Add active users report #4313

### Fixed

- don't throw if user isn't present on build
- catch the InvalidRange v3 error, don't fail the last build log fetch
- Check buildShaLink args if null on site build logs page
- add e2e tests in staging, build env vars to build step
- Await createUAAIdentity in admin user API tests
- Explicitly truncate UAAIdentity after admin user API tests
- Add global Sequelize hook to make count behavior consistent with find.

### Maintenance

- Update CommitSummary commponent data fetch to useState
- correct staging e2e pipeline
- Upgrade local and CI to Postgres v15
- update depedencies
- Fix syntax error and remove outdated setup step from developer documentation

## 0.4.1 (2023-11-30)

### Fixed

- transform AWS SDK Readable to string
- Add queue name for site build and build task  queues

### Maintenance

- Remove bull to complete bullmq transition
- upgrade major deps from audit
- update dependencies, minor patch bumps for pages core and admin client

## 0.4.0 (2023-11-16)

### Added

- Auto rotate site bucket keys #153
- add owasp zap scan task type migration (#4260)

### Fixed

- call correct fetchUser function on github auth (#4301)
- **ci**: Update ci staging audit src
- Make site uploaded files page work properly for sites without previews

### Maintenance

- Add length limit validation before branch name regex
- correct audit in staging, prod ci
- add yarn audit to ci (#4250)
- security/dependency updates
- add initial playwright implementation (#4102)
- add small adjustment to dev env setting
- Upgrade to AWS SDK V3 (#3989)
- update slack release notes format and bump pattern matcher

## 0.3.2 (2023-10-19)

### Fixed

- Fixes domain checkProvisionStatus with new CF api response

## 0.3.1 (2023-10-17)

### Maintenance

- Refine site repo migration docs

## 0.3.0 (2023-10-10)

### Added

- implement build task runners, call CF API directly (#4259)
- add build task queue and example worker (#4248)
- add build task router and controller (#4169)
- add DB models to support build task feature (#4184)
- Allow users to create custom domains to prepare launch

### Fixed

- Admin UI for updated site branch configs and domains

### Maintenance

- Improve name and path and update published sites report
- Update deps using json5 #4249
- Update CF API to V3 #4112
- update uaa war release download location
- use correct path for release notes

## 0.2.1 (2023-08-22)

### Performance

- Update pages production app to 4 instance with 512mb

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