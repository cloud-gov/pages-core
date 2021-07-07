const nodemailer = require('nodemailer');

const { mail: mailConfig } = require('../../config');

class Mailer {
  constructor({ from, ...config } = mailConfig) {
    // If we need to send messages in bulk we can look at pooling connections
    // https://nodemailer.com/smtp/pooled/
    this.transporter = nodemailer.createTransport(config, { from });

    this.send = this.send.bind(this);
  }

  send(to, subject, content) {
    return this.transporter.sendMail({
      to,
      subject,
      text: content,
      html: `<p>${content}</p>`,
    });
  }
}

module.exports = Mailer;
