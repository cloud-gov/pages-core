# Cloud.gov Pages
[![DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/cloud-gov/pages-core)
***Cloud.gov Pages is updated regularly. [Join our public chat room](https://chat.18f.gov/?channel=cg-pages-public) to talk to us and stay informed. You can also check out our [documentation](https://cloud.gov/pages/) to learn more.***

## About Pages

[Cloud.gov Pages](https://cloud.gov/pages/) helps federal government entities publish compliant static websites quickly and seamlessly. Cloud.gov Pages integrates with GitHub and is built on top of [cloud.gov](https://cloud.gov), which uses Amazon Web Services.

This repository is home to "pages-core" - a Node.js app that allows government users to create and configure Pages sites.

## Examples

More examples can be found at [https://cloud.gov/pages/success-stories/](https://cloud.gov/pages/success-stories/).

## Development

For information on development of this application, please see [DEVELOPMENT.md](./docs/DEVELOPMENT.md)

## Platform Ops

For information on running platform operations with this application, please see [OPERATIONS.md](./docs/OPERATIONS.md)

## Platform diagrams

Documents and visuallizes different system components and user flows within the Pages platform, please see [diagrams](./docs/diagrams/).

## Initial proposal

Federalist is new open source publishing system based on proven open source components and techniques. Once the text has been written, images uploaded, and a page is published, the outward-facing site will act like a simple web site -- fast, reliable, and easily scalable. Administrative tools, which require authentication and additional interactive components, can be responsive with far fewer users.

Regardless of the system generating the content, all websites benefit from the shared editor and static hosting, which alleviates the most expensive requirements of traditional CMS-based websites and enables shared hosting for modern web applications.

From a technical perspective, a modern web publishing platform should follow the “small pieces loosely joined” API-driven approach. Three distinct functions operate together under a unified user interface:

1. **Look & feel of the website**
Templates for common use-cases like a departmental website, a single page report site, API / developer documentation, project dashboard, and internal collaboration hub can be developed and shared as open source repositories on GitHub. Agencies wishing to use a template simply create a cloned copy of the template, add their own content, and modify it to suit their needs. Social, analytics, and accessibility components will all be baked in, so all templates are in compliance with the guidelines put forth by SocialGov and Section 508.

2. **Content editing**
Content editing should be a separate application rather than built into the web server. This allows the same editing interface to be used across projects. The editing interface only needs to scale to match the load from *editors*, not *visitors*.

3. **Publishing infrastructure**
Our solution is to provide scalable, fast, and affordable static hosting for all websites. Using a website generator like Jekyll allows for these sites to be built dynamically and served statically.

## Related reading

- [18F Blog Post on Federalist's platform launch](https://18f.gsa.gov/2015/09/15/federalist-platform-launch/)
- [Building CMS-Free Websites](https://developmentseed.org/blog/2012-07-27-how-we-build-cms-free-websites)
- [Background on relaunch of Healthcare.gov’s front-end](http://www.theatlantic.com/technology/archive/2013/06/healthcaregov-code-developed-by-the-people-and-for-the-people-released-back-to-the-people/277295/)
- [HealthCare.gov uses lightweight open source tools](https://www.digitalgov.gov/2013/05/07/the-new-healthcare-gov-uses-a-lightweight-open-source-tool/)
- [A Few Notes on NotAlone.gov](https://18f.gsa.gov/2014/05/09/a-few-notes-on-notalone-gov/)

## License

### Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.

### Exceptions

`public/images/illo-pushing-stone.png` and
`public/images/illo-pushing-stone@2x.png` concepts from ["Man Push The Stone" by
Berkah Icon, from the Noun
Project](https://thenounproject.com/berkahicon/collection/startup/?i=1441102)
made available under [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/us/legalcode).
