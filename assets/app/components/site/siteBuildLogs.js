import React from "react";
import buildLogActions from "../../actions/buildLogActions";

class SiteBuildLogs extends React.Component {
  componentDidMount() {
    buildLogActions.fetchBuildLogs({ id: this.props.params.buildId });
  }

  buildLogs() {
    if (!this.props.buildLogs) {
      return [];
    }

    return this.props.buildLogs.filter(log => {
      return log.build.id === parseInt(this.props.params.buildId);
    }).sort((a, b) => {
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  }

  render() {
    if (this.buildLogs().length > 0) {
      return this.renderBuildLogsTable()
    } else {
      return this.renderEmptyState()
    }
  }

  renderBuildLogsTable() {
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
          { this.buildLogs().map(log => this.renderBuildLogRow(log)) }
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

  renderEmptyState() {
    return <p>This build does not have any build logs</p>;
  }
}

export default SiteBuildLogs;
