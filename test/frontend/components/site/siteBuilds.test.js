import React from "react";
import { expect } from "chai";
import { shallow } from "enzyme";
import SiteBuilds from "../../../../frontend/components/site/siteBuilds";

let user
let build
let props

describe("<SiteBuilds/>", () => {
  beforeEach(() => {
    user = {
      id: 1,
      username: "user123",
    }
    build = {
      user: user.id,
      id: 1,
      branch: "master",
      createdAt: "2016-12-28T12:00:00",
      completedAt: "2016-12-28T12:05:00",
      state: "success",
    }
    props = {
      site: {
        builds: [
          build,
        ],
        users: [
          user,
        ],
      },
    }
  })

  const columnIndex = (wrapper, name) => {
    let index
    wrapper.find("th").children().forEach((child, childIndex) => {
      if (child.contains(name)) {
        index = childIndex
      }
    })
    return index
  }

  it("should render the username for a build's user", () => {
    const wrapper = shallow(<SiteBuilds {...props}/>)
    const userIndex = columnIndex(wrapper, "User")

    const userCell = wrapper.find("tr").at(1).find("td").at(userIndex)
    expect(userCell.text()).to.equal(user.username)
  })

  it("should render an empty string for the username for builds where the user cannot be found", () => {
    build.user = user.id + 1
    const wrapper = shallow(<SiteBuilds {...props}/>)
    const userIndex = columnIndex(wrapper, "User")

    const userCell = wrapper.find("tr").at(1).find("td").at(userIndex)
    expect(userCell.text()).to.equal("")
  })
})
