import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import SiteBuildLogs from '../../../../frontend/components/site/siteBuildLogs';

describe("<SiteBuildLogs/>", () => {
  it("should render a table with build logs for the given build", () => {
    const props = {
      params: { buildId: 1 },
      buildLogs: [
        { build: { id: 1 }, output: "output 1", source: "source 1" },
        { build: { id: 1 }, output: "output 2", source: "source 2" },
      ],
    };

    const wrapper = shallow(<SiteBuildLogs {...props} />);
    expect(wrapper.find("table")).to.have.length(1)
    expect(wrapper.find("table").contains("output 1")).to.be.true;
    expect(wrapper.find("table").contains("output 2")).to.be.true;
    expect(wrapper.find("table").contains("source 1")).to.be.true;
    expect(wrapper.find("table").contains("source 2")).to.be.true;
  });

  it("should not render logs for another build", () => {
    const props = {
      params: { buildId: 1 },
      buildLogs: [
        { build: { id: 1 } , output: "output 1", source: "source 1" },
        { build: { id: 2 }, output: "output 2", source: "source 2" },
      ],
    };

    const wrapper = shallow(<SiteBuildLogs {...props} />);
    expect(wrapper.find("table")).to.have.length(1);
    expect(wrapper.find("table").contains("output 1")).to.be.true;
    expect(wrapper.find("table").contains("output 2")).to.be.false;
    expect(wrapper.find("table").contains("source 1")).to.be.true;
    expect(wrapper.find("table").contains("source 2")).to.be.false;
  });

  it("should render an empty state if there are no builds", () => {
    const props = {
      params: { buildId: 1 },
      buildLogs: [],
    };

    const wrapper = shallow(<SiteBuildLogs {...props} />);
    expect(wrapper.find("table")).to.have.length(0);
    expect(wrapper.find("p")).to.have.length(1);
    expect(wrapper.find("p").contains("This build does not have any build logs")).to.be.true;
  });
});
