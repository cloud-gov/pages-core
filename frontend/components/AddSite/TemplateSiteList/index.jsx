import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { ORGANIZATIONS } from '../../../propTypes';
import TemplateSite from './templateSite';
import siteActions from '../../../actions/siteActions';

function onSubmitTemplate(site) {
  siteActions.addSite(site);
}

const templateGrid = (
  activeChildId,
  defaultOwner,
  handleChooseActive,
  handleSubmit,
  organizations,
  templates
) => (
  Object.keys(templates).map((templateKey, index) => {
    const template = templates[templateKey];

    return (
      <div className="federalist-template-list" key={templateKey}>
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
      </div>
    );
  })
);

function TemplateList(props) {
  const { defaultOwner, organizations } = props;
  const [activeChildId, setActiveChildId] = useState(-1);
  const templates = useSelector(state => state.FRONTEND_CONFIG.TEMPLATES);

  return (
    <div>
      <h2>Or choose from one of our templates</h2>
      {templateGrid(
        activeChildId,
        defaultOwner,
        setActiveChildId,
        onSubmitTemplate,
        organizations,
        templates
      )}
    </div>
  );
}

TemplateList.propTypes = {
  organizations: ORGANIZATIONS.isRequired,
  defaultOwner: PropTypes.string.isRequired,
};

export default TemplateList;
