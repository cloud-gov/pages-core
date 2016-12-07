import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import SitePreviewLinksTable from '../../../../../assets/app/components/site/sitePreviewLinksTable';

let site;

describe("<SitePreviewLinksTable/>", () => {
  beforeEach(() => {
    site = {
      branches: [
        { name: "branch-name" },
        { name: "default=branch" },
      ],
      owner: "owner-name",
      repository: "repo-name",
      defaultBranch: "default-ranch",
      viewLink: "www.example.com/owner-name/repo-name",
    };
  });

  it("render a table with a list of branches", () => {
    site.branches = [
      { name: "branch-a" },
      { name: "branch-b" },
    ];

    const wrapper = shallow(<SitePreviewLinksTable site={site}/>);
    const rows = wrapper.find("tbody").find("tr");

    expect(rows).to.have.length(2)
    expect(rows.at(0).contains("branch-a")).to.be.true;
    expect(rows.at(1).contains("branch-b")).to.be.true;
  });

  it("renders the view URL for the default branch", () => {
    site = {
      branches: [
        { name: "master" },
      ],
      defaultBranch: "master",
      viewLink: "www.example.com",
    };

    const wrapper = shallow(<SitePreviewLinksTable site={site}/>);
    const link = wrapper.find("a");

    expect(link.contains("View")).to.be.true;
    expect(link.prop("href")).to.equal(site.viewLink);
  });

  it("renders the the preview URL for preview branches", () => {
    site = {
      branches: [
        { name: "preview-branch" },
      ],
      owner: "owner-name",
      repository: "repo-name",
      defaultBranch: "master",
    };
    const previewURL = "/preview/owner-name/repo-name/preview-branch/"

    const wrapper = shallow(<SitePreviewLinksTable site={site}/>);
    const link = wrapper.find("a");

    expect(link.contains("View")).to.be.true;
    expect(link.prop("href")).to.equal(previewURL);
  });

  it("renders a placeholder if a site has not branch data", () => {
    site.branches = []

    const wrapper = shallow(<SitePreviewLinksTable site={site}/>);
    const rows = wrapper.find("tbody").find("tr");

    expect(rows).to.have.length(1)
    expect(rows.first().contains("No branch data")).to.be.true
  });
});
