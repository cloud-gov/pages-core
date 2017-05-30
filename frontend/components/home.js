import React from "react"
import { pushHistory } from "../actions/routeActions"

const homeHTML = require("./home.html")

const propTypes = {
  storeState: React.PropTypes.object
}

class Home extends React.Component {
  componentDidMount() {
    this.redirectForLoggedInUser()
  }

  componentDidUpdate() {
    this.redirectForLoggedInUser()
  }

  redirectForLoggedInUser() {
    const userState = this.props.storeState.user
    if (!userState.isLoading && userState.data) {
      pushHistory("/sites")
    }
  }

  render() {
    const hasLoginFailed = window.location.search.indexOf('login_failed') > -1;
    return (
      <main className="container">
        {
          hasLoginFailed ?
          <div className="usa-alert usa-alert-error usa-alert-home" role="alert">
            <div className="usa-alert-body">
              <h3 className="usa-alert-heading">Unauthorized</h3>
              <p className="usa-alert-text">Apologies; you don't have access to Federalist! Please contact the Federalist team if this is in error.</p>
            </div>
          </div>
          : ""
        }
        <div dangerouslySetInnerHTML={{ __html: homeHTML }}/>
      </main>
    )
  }
}

Home.propTypes = propTypes

export default Home
