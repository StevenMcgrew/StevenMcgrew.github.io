const User = require('../models/User')
const Temp = require('../models/Temp')
const bcrypt = require('bcryptjs')
const utils = require('../utils')

module.exports = server => {

    server.get('/user/appdata', utils.setNoCacheHeaders, async (req, res, next) => {
        try {

            // Try to get user by id
            let user = await User.findById(req.session.userId)
            if (!user) { res.json({ alert: 'App data request - No User or not Logged in.' }); return; }

            // Send user's appData in response
            res.json(user.appData)

        } catch (err) {
            console.log(err)
            res.json({ alert: err.toString() })
        }
    })

    server.post('/user/appdata', async (req, res, next) => {
        try {

            // Try to get user via session
            let user = await User.findById(req.session.userId)
            if (!user) { res.json({ alert: "Update appData request - No User or not Logged in" }); return; }

            // Update user's appData
            user.appData[req.body.propName] = req.body.propValue
            await user.save()
            res.json({ alert: "General app settings successfully saved to server." })

        } catch (err) {
            console.log(err)
            res.json({ alert: err.toString() })
        }
    })

    server.get('/user/accountdata', utils.setNoCacheHeaders, async (req, res, next) => {
        try {

            // Try to get user by id
            let user = await User.findById(req.session.userId)
            if (!user) { res.json({ alert: 'Account data request - No User or not Logged in.' }); return; }

            // Send specific account data in response
            res.json({
                username: user.appData.username,
                email: user.email
            })

        } catch (err) {
            console.log(err)
            res.json({ error: err.toString() })
        }
    })

    server.post('/user/accountdata/checkemail', async (req, res, next) => {
        try {
            let email = req.body.email

            // Try to get user via session
            let user = await User.findById(req.session.userId)
            if (!user) { res.statusMessage = 'Log in expired. Please refresh page and log in.'; res.status(409).end(); return; }

            // Check if the email address that was submitted is the same as what they currently have
            if (user.email === email) { res.send('1'); return; } // Just send an "okay" response, so that there is no warning, because there's no problem having the same email address

            // Check if email is already taken in users
            let user2 = await User.findOne({ email })
            if (user2) { res.send('0'); return; }

            // Email address is available
            res.send('1')

        } catch (err) {
            res.statusMessage = 'There was a problem when checking email address availability'; res.status(500).end();
        }
    })

    server.get('/user/accountdata/checkusername/:username', utils.setNoCacheHeaders, async (req, res, next) => {
        try {
            let username = req.params.username
            let queryParam = { 'appData.username': username } // Must use dot notation inside the object in order to find a specific nested item (That is how MongoDb and Mongoose work)

            // Try to get user via session
            let user = await User.findById(req.session.userId)
            if (!user) { res.statusMessage = 'Log in expired. Please refresh page and log in.'; res.status(409).end(); return; }

            // Check if the username that was submitted is the same as what they currently have
            if (user.appData.username === username) { res.send('1'); return; } // Just send an "okay" response, so that there is no warning, because there's no problem having the same username

            // Check if username is already taken in users
            let user2 = await User.findOne(queryParam)
            if (user2) { res.send('0'); return; }

            // Check if username is already taken in temps
            let temp = await Temp.findOne({ username })
            if (temp) { res.send('0'); return; }

            // Username is available
            res.send('1')

        } catch (err) {
            res.statusMessage = 'There was a problem when checking username availabiity'; res.status(500).end();
        }
    })

    server.post('/user/accountdata', async (req, res, next) => {
        try {

            // Try to get user via session
            let user = await User.findById(req.session.userId)
            if (!user) { res.statusMessage = 'Update account request - No User or not Logged in'; res.status(409).end(); return; }

            // Validate inputs
            let { email, username } = req.body
            if (!utils.validateUsername(username)) { res.statusMessage = 'Server detected invalid Username'; res.status(409).end(); return; }

            // If the email is the same, we can just update and save everything
            if (user.email === email) {
                user.appData.username = username
                await user.save()
                res.json({ email: user.email, username: user.appData.username })
                return;
            }

            // When email is new, we have to go through the verification process...

            // Delete temp if one already exists with that email address
            await Temp.findOneAndDelete({ email })

            // Check if email is already saved to users
            let userCheck = await User.findOne({ email })
            if (userCheck) { res.statusMessage = 'That email address is already in use. Please enter a different email address.'; res.status(409).end(); return; }

            // Create verification code and new temp
            let verificationCode = Math.floor(Math.random() * 899999 + 100000)
            let temp = new Temp({
                email: email,
                username: username,
                password: user.password,
                verificationCode: verificationCode
            })

            // Hash verification code, and save temp
            let hash = await bcrypt.hash(temp.verificationCode, 10)
            temp.verificationCode = hash
            await temp.save()

            // Send verification email
            let message = "Verify you made a request to update your account."
            utils.sendVerificationEmail(email, verificationCode, message)
            res.json({ emailSent: true })

        } catch (err) {
            console.log(err)
            res.statusMessage = 'There was a problem updating your account. Please try again or contact support.'; res.status(500).end();
        }
    })

    server.post('/user/accountdata/verify', async (req, res, next) => {
        try {
            let { email, verificationCode } = req.body

            // Try to get user via session
            let user = await User.findById(req.session.userId)
            if (!user) { res.statusMessage = 'Update account request - No User or not Logged in'; res.status(409).end(); return; }

            // Try to get temp
            let temp = await Temp.findOne({ email })
            if (!temp) { res.statusMessage = 'The verification code has expired. Please refresh the page and start over.'; res.status(409).end(); return; }

            // Check verification code
            let isMatch = await bcrypt.compare(verificationCode, temp.verificationCode)
            if (!isMatch) { res.statusMessage = 'The verification code did not match. Please check the code and try again.'; res.status(409).end(); return; }

            // Update user account data
            user.email = temp.email
            user.appData.username = temp.username
            await user.save()

            // Delete from temp
            await Temp.findByIdAndDelete(temp.id)

            // Done
            res.json({ email: user.email, username: user.appData.username })

        } catch (err) {
            console.log(err)
            res.statusMessage = 'There was a problem when checking the verification code'; res.status(500).end();
        }
    })

    server.post('/user/accountdata/password', async (req, res, next) => {
        try {

            // Try to get user via session
            let user = await User.findById(req.session.userId)
            if (!user) { res.statusMessage = 'Update password request - No User or not Logged in'; res.status(409).end(); return; }

            // Validate inputs
            let { oldPassword, newPassword } = req.body
            let alertMessage = ''
            if (!utils.validatePassword(oldPassword)) { alertMessage += 'The Current Password is invalid.\n\n' }
            if (!utils.validatePassword(newPassword)) { alertMessage += 'The New Password is invalid.\n\n' }
            if (alertMessage) { res.statusMessage = alertMessage; res.status(409).end(); return; }

            // Check current password
            let isMatch1 = await bcrypt.compare(oldPassword, user.password)
            if (!isMatch1) { res.statusMessage = 'The Current Password you entered does not match our database records.'; res.status(409).end(); return; }

            // Hash new password and save it
            let hash = await bcrypt.hash(newPassword, 10)
            user.password = hash
            await user.save()
            res.sendStatus(200)

        } catch (err) {
            console.log(err)
            res.statusMessage = 'There was a problem when trying to update your password. Please refresh the page and try again.'; res.status(500).end();
        }
    })

}