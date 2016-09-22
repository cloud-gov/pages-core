import { encodeB64 } from '../util/encoding';

export default path => {
  return `_draft-${encodeB64(path)}`;
};
