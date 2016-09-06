import { buildMenuItems } from 'prosemirror/dist/example-setup'
import { insertItem } from 'prosemirror/dist/menu';
import { schema } from 'prosemirror/dist/schema-basic';

const menuImageExtension = (onMenuItemSelect) => {
  if (typeof onMenuItemSelect !== 'function') {
    console.warn('menuImageExtension expects a function as it\'s sole argument.');
  }

  const onSelect = typeof onMenuItemSelect === 'function' && onMenuItemSelect ||
    function () {};

  const newImage = insertItem(schema.nodes.image, {
    label: 'Image',
    attrs: (pm, callback) => {
      onSelect();
    }
  });

  const menu = buildMenuItems(schema);
  menu.insertMenu.content[0] = newImage;

  return menu;
};

export default menuImageExtension;
