import React from 'react';
import { connect } from 'react-redux';

import { SITE, USER } from '../../propTypes';
import siteActions from '../../actions/siteActions';
import { currentSite } from '../../selectors/site';

class NotificationSettings extends React.Component {
  constructor(props) {
    super(props);

    const collaborator = (props.site.users.find(u => u.id === props.user.id) || {});

    this.state = { value: (collaborator.buildNotificationSetting || 'site') };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    const { site: { id } } = this.props;
    const { value } = this.state;

    // eslint-disable-next-line no-alert
    siteActions.updateSiteUser(id, { buildNotificationSetting: value });
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  render() {
    const { value } = this.state;

    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="buildNotificationSetting">
            Receive build notifications:
            <select
              id="buildNotificationSetting"
              value={value}
              onChange={this.handleChange}
            >
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
}

NotificationSettings.propTypes = {
  site: SITE,
  user: USER,
};

NotificationSettings.defaultProps = {
  site: null,
  user: null,
};

const mapStateToProps = ({ user, sites }, { id }) => ({
  user: user.data,
  site: currentSite(sites, id),
});

export { NotificationSettings };
export default connect(mapStateToProps)(NotificationSettings);
