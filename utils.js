const nodemailer = require('nodemailer');

module.exports = {

    sendEmail: function (to, subject, html) {

        let transporter = nodemailer.createTransport({
            host: "smtp-mail.outlook.com", // hostname
            secureConnection: false, // TLS requires secureConnection to be set to false
            port: 587, // port for secure SMTP
            tls: {
                ciphers: 'SSLv3'
            },
            auth: {
                user: 'stevenmcgrew8224@msn.com',
                pass: 'fLyHjZtE!9Z5'
            }
        })

        let mailOptions = {
            from: 'stevenmcgrew8224@msn.com',
            to: to,
            subject: subject,
            html: html
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        })
    },

    sendVerificationEmail: function (address, verificationCode, message) {
        let subject = "MyRepairsOnline - Verify it's you"
        let html = `<p>${message}</p>
                    <p>Your verification code is: <span style="color: green; font-weight: bold;">${verificationCode}</span></p>
                    <p>Please enter the verification code at the webpage you were at. If you did not make this request, you can delete this email.</p>`
        this.sendEmail(address, subject, html)
    },

    validateUsername: function (username) {
        let isValid = false
        let illegalChars = /\W/; // allow letters, numbers, and underscores
        if (username.length < 2 || username.length > 20 || illegalChars.test(username)) { isValid = false }
        else { isValid = true }
        return isValid
    },

    validatePassword: function (password) {
        let isValid = false
        let illegalChars = /[^\x20-\x5B+\x5D-\x7E]/; // any char that is not a printable ASCII char from (hexidecimal) 20 to 5B and 5D to 7E
        if (password.length < 8 || password.length > 20 || illegalChars.test(password)) { isValid = false }
        else { isValid = true }
        return isValid
    },

    setNoCacheHeaders: function (req, res, next) {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        next();
    }

}