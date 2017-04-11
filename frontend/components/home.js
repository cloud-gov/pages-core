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
    if (this.props.storeState.user) {
      pushHistory("/sites")
    }
  }

  render() {
    return <div dangerouslySetInnerHTML={{ __html: homeHTML }}/>
  }
}

Home.propTypes = propTypes

export default Home
