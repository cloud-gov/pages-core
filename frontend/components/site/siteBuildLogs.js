import React from "react";
import buildLogActions from "../../actions/buildLogActions";

class SiteBuildLogs extends React.Component {
  componentDidMount() {
    buildLogActions.fetchBuildLogs({ id: this.props.params.buildId });
  }

  buildLogs() {

    if (this.props.buildLogs.isLoading || !this.props.buildLogs.data) {
      return [];
    } else {
      return this.props.buildLogs.data
    }
  }

  render() {
    const buildLogs = this.buildLogs()
    if (this.props.buildLogs.isLoading) {
      return this.renderLoadingState()
    } else if (!buildLogs.length) {
      return this.renderEmptyState()
    } else {
      return this.renderBuildLogsTable(buildLogs)
    }
  }

  renderBuildLogsTable(buildLogs) {
    return (
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th>Output</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          { buildLogs.map(log => this.renderBuildLogRow(log)) }
        </tbody>
      </table>
    )
  }

  renderBuildLogRow(log) {
    return (
      <tr key={log.id}>
        <td>{ log.source }</td>
        <td>
          <output><pre
            style={{ whiteSpace: "pre-wrap" }}
          >{ log.output }</pre></output>
        </td>
        <td>{ log.createdAt }</td>
      </tr>
    )
  }

  renderLoadingState() {
    // TODO: Replace with a loading component
    return <p>Loading build logs</p>
  }

  renderEmptyState() {
    return <p>This build does not have any build logs</p>;
  }
}

export default SiteBuildLogs;
