import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import siteActions from '@actions/siteActions';

import { ORGANIZATIONS } from '@propTypes';
import TemplateSite from './TemplateSite';

const templateGrid = (
  activeChildId,
  defaultOwner,
  handleChooseActive,
  handleSubmit,
  organizations,
  templates,
) =>
  Object.keys(templates).map((templateKey, index) => {
    const template = templates[templateKey];

    return (
      <ul className="federalist-template-list usa-card-group" key={templateKey}>
        <TemplateSite
          templateKey={templateKey}
          index={index}
          thumb={template.thumb}
          active={activeChildId}
          handleChooseActive={handleChooseActive}
          handleSubmit={handleSubmit}
          defaultOwner={defaultOwner}
          organizations={organizations}
          {...template}
        />
      </ul>
    );
  });

function TemplateList(props) {
  const { defaultOwner, organizations } = props;
  const [activeChildId, setActiveChildId] = useState(-1);
  const navigate = useNavigate();
  const templates = useSelector((state) => state.FRONTEND_CONFIG.TEMPLATES);

  function onSubmitTemplate(site) {
    siteActions.addSite(site, navigate);
  }

  return (
    <div className="margin-top-6">
      <h2>Or choose from one of our templates</h2>
      {templateGrid(
        activeChildId,
        defaultOwner,
        setActiveChildId,
        onSubmitTemplate,
        organizations,
        templates,
      )}
    </div>
  );
}

TemplateList.propTypes = {
  organizations: ORGANIZATIONS.isRequired,
  defaultOwner: PropTypes.string.isRequired,
};

export default TemplateList;
