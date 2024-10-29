const { layout, css } = require('./layout');

function alert({ errors, reason }) {
  return layout(`
    <p style="${css.p}"><strong>${reason}</strong></p>
    <p style="${css.p}">
      <ul>
        ${errors.map((error) => `<li style="${css.p}">${error}</li>`)}
      </ul>
    </p>
  `);
}

module.exports = alert;
