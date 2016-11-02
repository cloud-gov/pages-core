import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';

proxyquire.noCallThru();

describe("navigationJsonPageList", () => {
  let Fixture;
  let pathHasDraft;
  const pageListItem = () => <div>pageListItem</div>;

  beforeEach(() => {
    pathHasDraft = stub();
    Fixture = proxyquire('../../../../../../assets/app/components/site/Pages/navigationJsonPageList', {
      '../../../util/branchFormatter': {
        pathHasDraft: pathHasDraft
      },
      './pageListItem': pageListItem
    }).default;
  });

  it("emits a page with the right href, pageName, hasDraft value", () => {
    const title = "title title";
    const href = "aitch ref";
    const path = "P a T H";
    const branches = [ "master", "mister", "muster" ];
    const navigationJsonContent = [
      {
        title: title,
        href: href,
        path: path
      }
    ];
    const siteId = "siteIdsiteIdSiteSiteSiteSiteSite";
    const defaultBranch = "DEFAULT";
    const site = {
      "_navigation.json": navigationJsonContent,
      id: siteId,
      defaultBranch: defaultBranch,
      branches: branches
    };
    // super-coupled.
    const linkForHref = `/sites/${siteId}/edit/${defaultBranch}/${href}`;
    pathHasDraft.withArgs(href, branches).returns(false);

    const reactWrapper = shallow(<Fixture site={ site }/>);

    const pageListItemElement = reactWrapper.find(pageListItem);
    expect(pageListItemElement).to.have.length(1);
    expect(pageListItemElement.prop("pageName")).to.equal(title);
    expect(pageListItemElement.prop("href")).to.equal(linkForHref);
    expect(pageListItemElement.prop("hasDraft")).to.equal(false);
    expect(pageListItemElement.children()).to.have.length(0);
  });

  it("emits two pages with the right href, pageName, hasDraft value, one is a draft path", () => {
    const title = "title title";
    const href = "aitch ref";
    const path = "P a T H";
    const title2 = "title title 222";
    const href2 = "aitch ref 222";
    const path2 = "P a T H 2";
    const branches = [ "master", "mister", "muster" ];
    const navigationJsonContent = [
      {
        title: title,
        href: href,
        path: path
      },
      {
        title: title2,
        href: href2,
        path: path2
      }
    ];
    const siteId = "siteIdsiteIdSiteSiteSiteSiteSite";
    const defaultBranch = "DEFAULT";
    const site = {
      "_navigation.json": navigationJsonContent,
      id: siteId,
      defaultBranch: defaultBranch,
      branches: branches
    };
    // super-coupled.
    const linkForHref = `/sites/${siteId}/edit/${defaultBranch}/${href}`;
    const linkForHref2 = `/sites/${siteId}/edit/${defaultBranch}/${href2}`;
    pathHasDraft.withArgs(href, branches).returns(true);
    pathHasDraft.withArgs(href2, branches).returns(false);

    const reactWrapper = shallow(<Fixture site={ site }/>);

    const pageListItemElements = reactWrapper.find(pageListItem);
    expect(pageListItemElements).to.have.length(2);

    const pageListItemElement = pageListItemElements.at(0);
    const pageListItemElement2 = pageListItemElements.at(1);
    expect(pageListItemElement.prop("pageName")).to.equal(title);
    expect(pageListItemElement.prop("href")).to.equal(linkForHref);
    expect(pageListItemElement.prop("hasDraft")).to.equal(true);
    expect(pageListItemElement2.children()).to.have.length(0);
    expect(pageListItemElement2.prop("pageName")).to.equal(title2);
    expect(pageListItemElement2.prop("href")).to.equal(linkForHref2);
    expect(pageListItemElement2.prop("hasDraft")).to.equal(false);
    expect(pageListItemElement2.children()).to.have.length(0);
  });

  it("emits a page and its child with the right href, pageName, hasDraft value, one is a draft path", () => {
    const title = "title title";
    const href = "aitch ref";
    const path = "P a T H";
    const title2 = "title title 222";
    const href2 = "aitch ref 222";
    const path2 = "P a T H 2";
    const branches = [ "master", "mister", "muster" ];
    const navigationJsonContent = [
      {
        title: title,
        href: href,
        path: path,
        children: [
          {
            title: title2,
            href: href2,
            path: path2
          }
        ]
      }
    ];
    const siteId = "siteIdsiteIdSiteSiteSiteSiteSite";
    const defaultBranch = "DEFAULT";
    const site = {
      "_navigation.json": navigationJsonContent,
      id: siteId,
      defaultBranch: defaultBranch,
      branches: branches
    };
    // super-coupled.
    const linkForHref = `/sites/${siteId}/edit/${defaultBranch}/${href}`;
    const linkForHref2 = `/sites/${siteId}/edit/${defaultBranch}/${href2}`;
    pathHasDraft.withArgs(href, branches).returns(true);
    pathHasDraft.withArgs(href2, branches).returns(false);

    const reactWrapper = shallow(<Fixture site={ site }/>);

    const pageListItemElements = reactWrapper.find(pageListItem);
    expect(pageListItemElements).to.have.length(2);
    const parent = pageListItemElements.at(0);
    const children = parent.children();
    const child = children.find(pageListItem);

    expect(parent.prop("pageName")).to.equal(title);
    expect(parent.prop("href")).to.equal(linkForHref);
    expect(parent.prop("hasDraft")).to.equal(true);
    expect(child.prop("pageName")).to.equal(title2);
    expect(child.prop("href")).to.equal(linkForHref2);
    expect(child.prop("hasDraft")).to.equal(false);
    expect(child.children()).to.have.length(0);
  });
});
