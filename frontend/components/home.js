import PropTypes from 'prop-types';
import React from "react"
import { pushHistory } from "../actions/routeActions"

const homeHTML = require("./home.html")

const propTypes = {
  storeState: PropTypes.object
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
    return <div dangerouslySetInnerHTML={{ __html: homeHTML }}/>
  }
}

Home.propTypes = propTypes

export default Home
