import React from "react"
import { pushHistory } from "../actions/routeActions"
import LoadingIndicator from './loadingIndicator'

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
    if (!this.props.storeState.user.isLoading) {
      return <div dangerouslySetInnerHTML={{ __html: homeHTML }}/>
    } else {
      return <LoadingIndicator/>
    }
  }
}

Home.propTypes = propTypes

export default Home
