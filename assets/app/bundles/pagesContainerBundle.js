import PagesContainer from '../components/site/Pages/pagesContainer';
import isLoading from '../components/higherOrder/isLoading';
import isValidSite from '../components/higherOrder/isValidSite';

export default isLoading(
  isValidSite(
    PagesContainer
  )
);
