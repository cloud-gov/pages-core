function alert({ errors, reason }) {
  return `
    :flashing-alert: *${reason}*
  
    ${errors.map(error => `- ${error}`)}
  `;
}

module.exports = alert;
