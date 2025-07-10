const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1. create a transporter

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ehsanullahakbari53@gmail.com',
      pass: 'tjwg ywnt umof uwsc',
    },
  });

  const mailOptions = {
    from: 'Ehsanullah <ehsanullahakbari@gmail.com>',
    to: 'ehsanullahakbari53@gmail.com',
    subject: options.subject,
    text: options.message,
  };

  //3. actually send the email

    await transporter.sendMail(mailOptions);
    
};
module.exports = sendEmail;