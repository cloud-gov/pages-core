import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { ORGANIZATION } from '../../../propTypes';
import TemplateSite from './templateSite';

export class TemplateList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeChildId: -1,
    };

    this.handleChooseActive = this.handleChooseActive.bind(this);
  }

  handleChooseActive(childId) {
    this.setState({
      activeChildId: childId,
    });
  }

  render() {
    const {
      defaultOwner, handleSubmitTemplate, orgData, templates,
    } = this.props;
    const { activeChildId } = this.state;

    const templateGrid = Object.keys(templates).map((templateKey, index) => {
      const template = templates[templateKey];

      return (
        <div className="federalist-template-list" key={templateKey}>
          <TemplateSite
            templateKey={templateKey}
            index={index}
            thumb={template.thumb}
            active={activeChildId}
            handleChooseActive={this.handleChooseActive}
            handleSubmit={handleSubmitTemplate}
            defaultOwner={defaultOwner}
            orgData={orgData}
            {...template}
          />
        </div>
      );
    });

    return (
      <div>
        <h2>Or choose from one of our templates</h2>
        {templateGrid}
      </div>
    );
  }
}

TemplateList.propTypes = {
  // Templates data structure is described in config/templates.js and is
  // chellenging to describe with proptypes. Ignoring the rule here.
  // eslint-disable-next-line react/forbid-prop-types
  templates: PropTypes.object.isRequired,
  orgData: PropTypes.arrayOf(ORGANIZATION).isRequired,
  handleSubmitTemplate: PropTypes.func.isRequired,
  defaultOwner: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  templates: state.FRONTEND_CONFIG.TEMPLATES,
});

export default connect(mapStateToProps)(TemplateList);
