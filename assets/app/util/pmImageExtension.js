import { buildMenuItems } from 'prosemirror/dist/example-setup'
import { insertItem } from 'prosemirror/dist/menu';
import { schema } from 'prosemirror/dist/schema-basic';

const menuImageExtension = (callback) => {
  const newImage = insertItem(schema.nodes.image, {
    label: 'Image',
    attrs: (pm, callback) => {
      handleToggleImages();
    }
  });

  const menu = buildMenuItems(schema);
  menu.insertMenu.content[0] = newImage;

  return menu;
};

export default menuImageExtension;
