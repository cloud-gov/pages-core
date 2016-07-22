import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("assetsReducer", () => {
  let fixture;
  const SITE_ASSETS_RECEIVED = "hey, assets!";
  
  beforeEach(() => {
    fixture = proxyquire("../../../../assets/app/reducers/assets.js", {
      "../constants": {
        siteActionTypes: {
          SITE_ASSETS_RECEIVED: SITE_ASSETS_RECEIVED
        }
      }
    }).assets;
  });

  it("defaults to empty array and ignores other actions", () => {
    const actual = fixture(undefined, {
      type: "not what you're looking for",
      hello: "alijasfjir"
    });

    expect(actual).to.deep.equal([]);
  });

  it("appends data to empty state", () => {
    const SITE_1 = "site one";
    const URL_1 = "url one";
    const URL_2 = "url two";
    
    const assets = [{ url: URL_1 }, { url: URL_2 }];
    
    const actual = fixture([], {
      type: SITE_ASSETS_RECEIVED,
      assets: assets,
      siteId: SITE_1
    });

    expect(actual).to.deep.equal([{
      site: SITE_1,
      url: URL_1
    }, {
      site: SITE_1,
      url: URL_2
    }]);
  });

  it("appends data to state when there's no overlap in the new data", () => {
    const SITE_1 = "site one";
    const URL_1 = "url one";
    const URL_2 = "url two";
    
    const assets = [{ url: URL_1 }];
    
    const actual = fixture([{ site: SITE_1, url: URL_2 }], {
      type: SITE_ASSETS_RECEIVED,
      assets: assets,
      siteId: SITE_1
    });

    expect(actual).to.deep.equal([{
      site: SITE_1,
      url: URL_2
    }, {
      site: SITE_1,
      url: URL_1
    }]);
  });

  it("appends data to state unless there's overlap in the new data", () => {
    const SITE_1 = "site one";
    const URL_1 = "url one";
    const REPEAT_URL_1 = "url one";
    
    const assets = [{ url: REPEAT_URL_1 }];
    
    const actual = fixture([{ site: SITE_1, url: URL_1 }], {
      type: SITE_ASSETS_RECEIVED,
      assets: assets,
      siteId: SITE_1
    });

    expect(actual).to.deep.equal([{
      site: SITE_1,
      url: URL_1
    }]);
  });

  
  it("IS THIS A BUG??? does not append data to state if a site has an overlap in urls", () => {
    const SITE_1 = "site one";
    const SITE_2 = "site two";
    const URL_1 = "url one";
    const REPEAT_URL_1 = "url one";
    
    const assets = [{ url: REPEAT_URL_1 }];
    
    const actual = fixture([{ site: SITE_1, url: URL_1 }], {
      type: SITE_ASSETS_RECEIVED,
      assets: assets,
      siteId: SITE_2
    });

    expect(actual).to.deep.equal([{
      site: SITE_1,
      url: URL_1
    }]);
  });
});
