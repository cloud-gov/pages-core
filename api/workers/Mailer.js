const nodemailer = require('nodemailer');
const { htmlToText } = require('nodemailer-html-to-text');

const { mail: mailConfig } = require('../../config');

class Mailer {
  constructor({ from, ...config } = mailConfig) {
    this.transporter = nodemailer.createTransport(config, { from });
    this.transporter.use('compile', htmlToText());

    this.close = this.close.bind(this);
    this.send = this.send.bind(this);
    this.verify = this.verify.bind(this);
  }

  close() {
    return this.transporter.close();
  }

  send({ to, subject, html }) {
    return this.transporter.sendMail({ to, subject, html });
  }

  verify() {
    return this.transporter.verify();
  }
}

module.exports = Mailer;
