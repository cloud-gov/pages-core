import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';

proxyquire.noCallThru();

describe("getPageLayoutsFromConfig", () => {
  let Fixture;
  let parseYaml;
  const yaml = "looks: like a string";

  beforeEach(() => {
    parseYaml = stub();
    Fixture = proxyquire('../../../../../../../assets/app/components/site/editor/configs/getPageLayoutsFromConfig', {
      '../../../../util/parseYaml': { parseYaml }
    }).default;;
  });

  it("returns empty array if source yaml has no defaults property", () => {
    parseYaml.returns({});

    const actual = Fixture(yaml);

    expect(actual).to.deep.equal([]);
  });

  it("returns layout if source yaml has 'defaults[{ values: -->layout<-- }]' property", () => {
    const layout = [ "lay out the red carpet" ];
    parseYaml.returns({
      defaults: [
        {
          values: {
            layout: layout
          }
        }]
    });

    const actual = Fixture(yaml);

    expect(actual).to.deep.equal(layout);
  });
});
