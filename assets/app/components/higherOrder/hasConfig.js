import React from 'react';

const hasConfig = (Component) => {
  return class HasConfig extends React.Component {
    static propTypes = {
      site: React.PropTypes.shape({
        'config': React.PropTypes.oneOfType([
          React.PropTypes.object,
          React.PropTypes.string,
        ])
      })
    }

    render() {
      const { site: { config } } = this.props;
      /** The site object has a `config` property which will be:
       * - null if the site can't be found on github
       * - an empty string if the site does exist on github, but its contents
       * 	 haven't been fetched yet
       *
       * In the latter case, the `config` property will be replaced with
       * `_config.yml` once the site's contents are received
       *
       * TODO: investigate having some kind of default properties for objects
       * returned by reducers, to make this less confusing
      **/
      if (config === null) {
        return (
          <h4>
            The site you requested is either building for the first time, or cannot be found on GitHub. If you just created a new site via Federalist, check back in a few minutes.
          </h4>
        );
      }

      return <Component {...this.props} />;
    }
  }
};

export default hasConfig;
