import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { IconGlobe } from '@shared/icons';

const LocationBar = ({ path, storageRoot, onNavigate, trailingSlash = true }) => {
  // Only trim leading slashes, keep trailing
  const cleanedPath = path.replace(/^\/+/, '');
  const segments = cleanedPath ? cleanedPath.split('/').filter(Boolean) : [];
  // Show storageRoot only if it's the current or parent folder
  const showDomain = segments.length <= 1;
  const grandparentPath = segments.slice(0, -2).join('/') + '/';

  const displayedBreadcrumbs = useMemo(() => {
    const trailer = trailingSlash ? '/' : '';
    if (segments.length > 1) {
      // Ensure it only includes the last two segments
      return segments.slice(-2).map((seg, idx) => {
        if (idx === 1) return `${seg}${trailer}`;
        return `${seg}/`;
      });
    }
    return segments.length === 1 ? [`${segments[0]}${trailer}`] : [];
  }, [segments]);

  return (
    <nav
      className="
        usa-breadcrumb border-y-1px border-base padding-y-1 margin-top-3 text-ls-neg-1
      "
      aria-label="Breadcrumb"
    >
      <ol className="usa-breadcrumb__list font-mono">
        <li className="display-inline text-middle margin-x-2">
          <button
            className="usa-button--unstyled"
            onClick={() => onNavigate('/')}
            title="Public storage home"
            style={{ cursor: 'pointer' }}
          >
            <IconGlobe className="usa-icon width-3 height-3" />
          </button>
        </li>
        {showDomain && (
          <li className="usa-breadcrumb__list-item font-mono-xs">
            {!cleanedPath ? (
              <span>{storageRoot}/</span>
            ) : (
              // eslint-disable-next-line jsx-a11y/anchor-is-valid
              <a
                className="usa-breadcrumb__link text-underline"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/');
                }}
                href="#"
                title="/~assets/ root"
              >
                {storageRoot}/
              </a>
            )}
          </li>
        )}
        {segments.length > 1 && (
          <li className="usa-breadcrumb__list-item font-mono-xs">
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
              className="usa-breadcrumb__link text-underline"
              onClick={(e) => {
                e.preventDefault();
                onNavigate(grandparentPath);
              }}
              href="#"
            >
              ../
            </a>
          </li>
        )}
        {displayedBreadcrumbs.map((label, idx) => {
          const newPath =
            segments
              .slice(0, segments.length - displayedBreadcrumbs.length + idx + 1)
              .join('/') + '/';

          return (
            <li
              key={`${label}-${idx}`}
              className="usa-breadcrumb__list-item font-mono-xs"
            >
              {idx < displayedBreadcrumbs.length - 1 ? (
                // eslint-disable-next-line jsx-a11y/anchor-is-valid
                <a
                  className="usa-breadcrumb__link text-underline"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(newPath);
                  }}
                  title={label}
                  href="#"
                >
                  {label}
                </a>
              ) : (
                <span title={label}>{label}</span>
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
  storageRoot: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  trailingSlash: PropTypes.bool,
};

export default LocationBar;
