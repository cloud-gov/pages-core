import React from "react";
import { shallow } from "enzyme";
import { expect } from "chai";
import { spy } from "sinon";

import MediaThumbnail from "../../../../assets/app/components/mediaThumbnail";

describe("mediaThumbnail", () => {
  it("renders an img if it's a jpg extension", () => {
    const downloadUrl = "https://nowhere.gov/fake/url/here/hiiiiiiiiiPeople.fake_extension_ignored";
    const asset = {
      name: "hellooooWorld.jpg",
      download_url: downloadUrl
    };
    
    const reactWrapper = shallow(<MediaThumbnail asset={ asset }/>);

    expect(reactWrapper.contains(<img src={downloadUrl}/>)).to.be.true;
  });

  it("renders an img if it's a jpeg extension", () => {
    const downloadUrl = "https://nowhere.gov/fake/url/here/hiiiiiiiiiPeople.fake_extension_ignored";
    const asset = {
      name: "hellooooWorld.jpeg",
      download_url: downloadUrl
    };
    
    const reactWrapper = shallow(<MediaThumbnail asset={ asset }/>);

    expect(reactWrapper.contains(<img src={downloadUrl}/>)).to.be.true;
  });
  
  it("renders an img if it's a gif extension", () => {
    const downloadUrl = "https://nowhere.gov/fake/url/here/hiiiiiiiiiPeople.fake_extension_ignored";
    const asset = {
      name: "hellooooWorld.gif",
      download_url: downloadUrl
    };
    
    const reactWrapper = shallow(<MediaThumbnail asset={ asset }/>);

    expect(reactWrapper.contains(<img src={downloadUrl}/>)).to.be.true;
  });
  
  it("renders an img if it's a png extension", () => {
    const downloadUrl = "https://nowhere.gov/fake/url/here/hiiiiiiiiiPeople.fake_extension_ignored";
    const asset = {
      name: "hellooooWorld.png",
      download_url: downloadUrl
    };
    
    const reactWrapper = shallow(<MediaThumbnail asset={ asset }/>);

    expect(reactWrapper.contains(<img src={downloadUrl}/>)).to.be.true;
  });
  
  it("renders the download url if it's not a jpg/jpeg/png/gif extension", () => {
    const downloadUrl = "https://nowhere.gov/fake/url/here/hiiiiiiiiiPeople.fake_extension_ignored";
    const asset = {
      name: "hellooooWorld.aReallyGoofyExtension",
      download_url: downloadUrl
    };
    
    const reactWrapper = shallow(<MediaThumbnail asset={ asset }/>);

    expect(reactWrapper.contains(downloadUrl)).to.be.true;
  });

});
