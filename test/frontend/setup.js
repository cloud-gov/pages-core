import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

process.env.APP_HOSTNAME = '/';
process.env.PRODUCT = 'federalist';
