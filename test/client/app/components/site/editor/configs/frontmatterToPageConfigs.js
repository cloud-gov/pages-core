import { expect } from 'chai';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

describe("frontmatterToPageConfigs", () => {
  let fixture;

  const layout = "lay out";
  const title = "ti tle";
  const frontmatter = `layout: ${layout}\ntitle: ${title}`;
  const layouts = ["anything", "you want"];
  const handleChange = () => { };

  it("extracts form field values and page configs from frontmatter", () => {
    const state = {
      layout: layout,
      title: title
    };
    const expectedBaseFields = [{
      field: 'select',
      props: {
        name: 'layout',
        options: layouts,
        value: layout,
        handler: handleChange
      }
    }, {
      field: 'input',
      props: {
        type: 'text',
        name: 'title',
        value: title,
        handler: handleChange
      }
    }];

    const parseYaml = stub();
    parseYaml.withArgs(frontmatter).returns(state);

    fixture = proxyquire('../../../../../../../assets/app/components/site/editor/configs/frontmatterToPageConfigs', {
      '../../../../util/parseYaml': { parseYaml }
    }).default;

    const expectedPageConfiguration = {};
    const { fields, configuration } = fixture(frontmatter, layouts, handleChange);

    expect(fields).to.deep.equal(expectedBaseFields);
    expect(configuration).to.deep.equal(expectedPageConfiguration);
  });

  it("uses default values for form fields not in frontmatter", () => {
    const state = {
      layout: layout
    };

    const expectedBaseFields = [{
      field: 'select',
      props: {
        name: 'layout',
        options: layouts,
        value: layout,
        handler: handleChange
      }
    }, {
      field: 'input',
      props: {
        type: 'text',
        name: 'title',
        value: '',
        handler: handleChange
      }
    }];

    const parseYaml = stub();
    parseYaml.withArgs(frontmatter).returns(state);

    fixture = proxyquire('../../../../../../../assets/app/components/site/editor/configs/frontmatterToPageConfigs', {
      '../../../../util/parseYaml': { parseYaml }
    }).default;

    const expectedPageConfiguration = {};

    const { fields, configuration } = fixture(frontmatter, layouts, handleChange);

    expect(fields).to.deep.equal(expectedBaseFields);
    expect(configuration).to.deep.equal(expectedPageConfiguration);
  });
});
