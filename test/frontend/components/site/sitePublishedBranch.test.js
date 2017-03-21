import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import SitePublishedBranch from '../../../../frontend/components/site/sitePublishedBranch';


describe("<SitePublishedBranch/>", () => {
  it("should render a table with the files for the given branch", () => {
    const props = {
      params: { id: 1, name: "master" },
      publishedBranches: [
        { name: "master", viewLink: "www.example.gov/master", site: { id: 1 }, files: ["abc"] },
      ]
    }

    const wrapper = shallow(<SitePublishedBranch {...props} />)
    expect(wrapper.find("h3").contains("master")).to.be.true
  })

  it("should render the branches name", () => {
    const correctFiles = ["abc", "abc/def", "ghi"]
    const incorrectFiles = ["xyz"]
    const props = {
      params: { id: 1, name: "master" },
      publishedBranches: [
        { name: "master", viewLink: "www.example.gov/master", site: { id: 1 }, files: correctFiles },
        { name: "preview", viewLink: "www.example.gov/preview", site: { id: 1 }, files: incorrectFiles },
        { name: "master", viewLink: "www.example.gov/wrong", site: { id: 2 }, files: incorrectFiles },
      ]
    }

    const wrapper = shallow(<SitePublishedBranch {...props} />)
    expect(wrapper.find("table")).to.have.length(1)
    expect(wrapper.find("table").contains("abc")).to.be.true
    expect(wrapper.find("table").contains("abc/def")).to.be.true
    expect(wrapper.find("table").contains("ghi")).to.be.true
  })

  it("should render an empty state if there is no branch", () => {
    const props = {
      params: { id: 1, name: "master" },
      publishedBranches: [
        { name: "preview", viewLink: "www.example.gov/master", site: { id: 1 }, files: [] },
      ]
    }

    const wrapper = shallow(<SitePublishedBranch {...props} />)
    expect(wrapper.find("p").contains("No published branch data available")).to.be.true
  })

  it("should render an empty state if there are no files", () => {
    const props = {
      params: { id: 1, name: "master" },
      publishedBranches: [
        { name: "master", viewLink: "www.example.gov/master", site: { id: 1 } },
      ]
    }

    const wrapper = shallow(<SitePublishedBranch {...props} />)
    expect(wrapper.find("p").contains("No published branch files available")).to.be.true
  })
})
