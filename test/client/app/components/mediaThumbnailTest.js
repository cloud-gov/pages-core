import React from "react";
import { shallow } from "enzyme";
import { expect } from "chai";
import { spy } from "sinon";

import MediaThumbnail from "../../../../assets/app/components/mediaThumbnail";

describe("mediaThumbnail", () => {
  const downloadUrl = "https://nowhere.gov/fake/url/here/hiiiiiiiiiPeople.fake_extension_ignored";

  it("renders an img if it's a jpg extension", () => {
    verifyAssetWithExtensionIsRenderedAsAnImgTag("jpg");
  });

  it("renders an img if it's a jpeg extension", () => {
    verifyAssetWithExtensionIsRenderedAsAnImgTag("jpeg");
  });
  
  it("renders an img if it's a gif extension", () => {
    verifyAssetWithExtensionIsRenderedAsAnImgTag("gif");
  });

  it("renders an img if it's a png extension", () => {
    verifyAssetWithExtensionIsRenderedAsAnImgTag("png");
  });

  const verifyAssetWithExtensionIsRenderedAsAnImgTag = (extension) => {
    const asset = {
      name: `hellooooWorld.${extension}`,
      download_url: downloadUrl
    };
    
    const reactWrapper = shallow(<MediaThumbnail asset={ asset }/>)
    
    expect(reactWrapper.contains(<img src={downloadUrl}/>)).to.be.true;
  };

  it("renders the download url if it's not a jpg/jpeg/png/gif extension", () => {
    const asset = {
      name: "hellooooWorld.aReallyGoofyExtension",
      download_url: downloadUrl
    };
    
    const reactWrapper = shallow(<MediaThumbnail asset={ asset }/>);

    expect(reactWrapper.contains(downloadUrl)).to.be.true;
  });

});
