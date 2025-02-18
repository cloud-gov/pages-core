import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { IconGlobe } from '@shared/icons';

const LocationBar = ({ path, siteId, domain, onNavigate }) => {
  const baseUrl = `/sites/${siteId}/storage`;
  const cleanedPath = path.replace(/^\/+|\/+$/g, ''); // Trim leading and trailing slashes
  const segments = cleanedPath ? cleanedPath.split('/') : [];

  const showDomain = segments.length <= 1; // Show domain/~assets/ only if it's the current or parent folder
  const grandparentPath = segments.slice(0, segments.length - 1).join('/');
  const grandparentHref = `${baseUrl}?path=${grandparentPath}`;

  const displayedBreadcrumbs = useMemo(() => {
    if (segments.length > 1)
      return [segments[segments.length - 2], segments[segments.length - 1]];
    if (segments.length === 1) return [segments[0]];
    return [];
  }, [segments]);

  const handleNavigation = (newPath) => {
    if (onNavigate) onNavigate(newPath);
  };

  return (
    <nav
      className="usa-breadcrumb border-top-1px border-bottom-1px border-base-light padding-y-1 margin-top-3 text-ls-neg-1"
      aria-label="Breadcrumb"
    >
      <ol className="usa-breadcrumb__list font-mono">
        <li className="display-inline text-middle margin-right-1">
          <button
            className="usa-button--unstyled"
            onClick={() => handleNavigation('')}
            title="Public storage home"
            style={{ cursor: 'pointer' }}
          >
            <IconGlobe className="usa-icon width-3 height-3" />
          </button>
        </li>
        {showDomain && (
          <li className="usa-breadcrumb__list-item font-mono-xs">
            {!cleanedPath ? (
              <span>{domain}~assets/</span>
            ) : (
              <Link
                to={baseUrl}
                className="usa-breadcrumb__link text-underline"
                onClick={() => handleNavigation('')}
                title="/~assets/ root"
              >
                {domain}~assets/
              </Link>
            )}
          </li>
        )}
        {segments.length > 1 && (
          <li className="usa-breadcrumb__list-item font-mono-xs">
            <Link
              to={grandparentHref}
              className="usa-breadcrumb__link text-underline"
              onClick={() => handleNavigation(grandparentPath)}
              title={grandparentHref}
            >
              ../
            </Link>
          </li>
        )}
        {displayedBreadcrumbs.map((label, idx) => {
          const newPath = segments
            .slice(0, segments.length - displayedBreadcrumbs.length + idx + 1)
            .join('/');
          const href = `${baseUrl}?path=${newPath}`;
          return (
            <li
              key={`${label}-${idx}`}
              className="usa-breadcrumb__list-item font-mono-xs"
            >
              {idx < displayedBreadcrumbs.length - 1 ? (
                <Link
                  to={href}
                  className="usa-breadcrumb__link text-underline"
                  onClick={() => handleNavigation(newPath)}
                  title={label}
                >
                  {label}/
                </Link>
              ) : (
                <span title={label}>{label}/</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

LocationBar.propTypes = {
  path: PropTypes.string.isRequired,
  siteId: PropTypes.string.isRequired,
  domain: PropTypes.string.isRequired,
  onNavigate: PropTypes.func,
};

export default LocationBar;
