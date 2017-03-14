import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import SitePublishedBranches from '../../../../frontend/components/site/sitePublishedBranches';

describe("<SitePublishedBranches/>", () => {
  it("should render a table with branches for the given site", () => {
    const props = {
      params: { id: 1 },
      publishedBranches: [
        { name: "branch-a", viewLink: "www.example.gov/branch-a", site: { id: 1 } },
        { name: "branch-b", viewLink: "www.example.gov/branch-b", site: { id: 1 } },
      ]
    }

    const wrapper = shallow(<SitePublishedBranches {...props}/>)
    expect(wrapper.find("table")).to.have.length(1)
    expect(wrapper.find("table").contains("branch-a")).to.be.true
    expect(wrapper.find("table").contains("branch-b")).to.be.true
  })

  it("shoud not render branches for another site", () => {
    const props = {
      params: { id: 1 },
      publishedBranches: [
        { name: "branch-a", viewLink: "www.example.gov/branch-a", site: { id: 1 } },
        { name: "branch-b", viewLink: "www.example.gov/branch-b", site: { id: 2 } },
      ]
    }

    const wrapper = shallow(<SitePublishedBranches {...props}/>)
    expect(wrapper.find("table")).to.have.length(1)
    expect(wrapper.find("table").contains("branch-a")).to.be.true
    expect(wrapper.find("table").contains("branch-b")).to.be.false
  })

  it("should render a loading state if there are no published branches", () => {
    const props = {
      params: { id: 1 },
      publishedBranches: []
    }

    const wrapper = shallow(<SitePublishedBranches {...props}/>)
    expect(wrapper.find("table")).to.have.length(0)
    expect(wrapper.find("p")).to.have.length(1)
    expect(wrapper.find("p").contains("No published branch data available")).to.be.true
  })
})
