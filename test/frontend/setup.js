import { configure } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';

configure({ adapter: new Adapter() });

process.env.APP_HOSTNAME = '/';
process.env.PRODUCT = 'federalist';
