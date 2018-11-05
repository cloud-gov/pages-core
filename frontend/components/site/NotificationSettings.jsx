import React from 'react';
import { connect } from 'react-redux';
import { Field, reduxForm } from 'redux-form';
import PropTypes from 'prop-types';

import { SITE, USER } from '../../propTypes';
import siteActions from '../../actions/siteActions';


class NotificationSettings extends React.Component {
  constructor(props) {
    super(props);

    const buildNotify = (props.site.users.find(u => u.id === props.user.id) || {}).buildNotify;

    this.state = { value: (buildNotify || 'site')};//should change value to buildNotify

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit() {
  // eslint-disable-next-line no-alert
    siteActions.updateSiteUser(this.props.site.id, { buildNotify: this.state.value });
  }

  handleChange(event){  
    this.setState({value: event.target.value});
  }

  render() {
    return (
      <div>
        <p>
          blah blah blah
        </p>
        <form onSubmit={this.handleSubmit}>
        <label>
          Recieve build notifications:
          <select value={this.state.value} onChange={this.handleChange}>
            <option value="none">None</option>
            <option value="builds">My site builds only</option>
            <option value="site">All site builds</option>
          </select>
        </label>
        <input type="submit" value="Submit" />
      </form>
      </div>
    );
  }
};

NotificationSettings.propTypes = {
  site: SITE,
  user: USER,
  buildNotify: PropTypes.shape({
    isLoading: PropTypes.bool,
    data: PropTypes.array,
  }),
};

NotificationSettings.defaultProps = {
  site: null,
  user: null,
};

const mapStateToProps = ({ user, sites }) => ({
  user: user.data,
  site: sites.currentSite,
});

export { NotificationSettings };
export default connect(mapStateToProps)(NotificationSettings);
