import React from 'react';

const hasConfig = (Component) => {
  function getContent(configFilePresent) {
    if (configFilePresent) {
      return <Component {...this.props} />;
    }

    return (
      <h4>
        The site you requested is either building for the first time, or cannot be found on GitHub. If you just created a new site via Federalist, check back in a few minutes.
      </h4>
    );
  }

  return class HasConfig extends React.Component {
    static propTypes = {
      site: React.PropTypes.shape({
        '_config': React.PropTypes.oneOfType([
          React.PropTypes.object,
          React.PropTypes.string,
        ])
      })
    }

    render() {
      const { site } = this.props;
      const siteHasConfigFile = !!site['_.config.yml'];

      return getContent(siteHasConfigFile);
    }
  }
};

export default hasConfig;
