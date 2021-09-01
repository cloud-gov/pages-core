const layout = require('./layout');

function alert({ errors, reason }) {
  return layout(`
    <p><strong>${reason}</strong></p>
    <p>
      <ul>
        ${errors.map(error => `<li>${error}</li>`)}
      </ul>
    </p>
  `);
}

module.exports = alert;
