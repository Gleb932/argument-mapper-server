const nodemailer = require("nodemailer");
const util = require('util');

let transporter = nodemailer.createTransport({
    host: "smtp-relay.sendinblue.com",
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
    }
});

transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("SMTP server verified");
    }
});

const messageTemplate = {
    from: process.env.SMTP_USER,
    to: "%s",
    subject: "Argument mapper account verification",
    text: "Test",
    html: `Click <a href="https://argument-mapper-server.herokuapp.com/verification?userID=%s&verification_str=%s">here</a> to activate your Argument mapper account.`
};

function sendVerification(email, userID, emailVerificationStr)
{
    let message = {};
    message = Object.assign(message, messageTemplate);
    message.to = util.format(message.to, email);
    message.html = util.format(message.html, userID, emailVerificationStr);
    transporter.sendMail(message, (error, result) => {
        if (error)
        {
            console.error(error);
            return false;
        }
        return true;
    });
}

module.exports = {
    sendVerification
};