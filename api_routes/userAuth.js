const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Temp = require('../models/Temp')
const config = require('../config');
const utils = require('../utils')

module.exports = server => {

    // Check email availability
    server.post('/signup/checkemail', async (req, res, next) => {
        try {
            let email = req.body.email

            // Check if email is already saved to users
            let user = await User.findOne({ email })
            if (user) { res.send('0'); return; }

            // Email address is available
            res.send('1')
        } catch (err) {
            res.statusMessage = 'There was a problem when checking email address availability'; res.status(500).end();
        }
    })

    // Check username availability
    server.get('/signup/checkusername/:username', utils.setNoCacheHeaders, async (req, res, next) => {
        try {
            let username = req.params.username
            let queryParam = { 'appData.username': username } // Must use dot notation inside the object in order to find a specific nested item (That is how MongoDb and Mongoose work)

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

    // Save new user to temp and send verification email
    server.post('/signup/temp', async (req, res, next) => {
        try {
            let { email, username, password } = req.body

            // Validate username and password
            let warning = ''
            if (!utils.validateUsername(username)) { warning += 'Server detected invalid Username. ' }
            if (!utils.validatePassword(password)) { warning += 'Server detected invalid Password.' }
            if (warning) { res.statusMessage = warning; res.status(409).end(); return; }

            // Delete from temp (edge case, in case of multiple sign ups with same email address)
            await Temp.findOneAndDelete({ email })

            // Check if email is already saved to users
            let user = await User.findOne({ email })
            if (user) { res.statusMessage = "That email address is already in use. Please enter a different email address."; res.status(409).end(); return; }

            // Create verification code and new temp
            let verificationCode = Math.floor(Math.random() * 899999 + 100000)
            let temp2 = new Temp({ email, username, password, verificationCode })

            // Hash password and verification code, and save temp
            let pHash = await bcrypt.hash(temp2.password, 10)
            let vHash = await bcrypt.hash(temp2.verificationCode, 10)
            temp2.password = pHash
            temp2.verificationCode = vHash
            await temp2.save()

            // Send verification email and respond with 200 status
            let message = "You have a new account! We just need to verify it's you."
            utils.sendVerificationEmail(email, verificationCode, message)
            res.sendStatus(200)

        } catch (err) {
            console.log(err)
            res.statusMessage = 'There was a problem when creating new temporary user'; res.status(500).end();
        }
    })

    // Signup verification and save temp to user
    server.post('/signup/verify', async (req, res, next) => {
        try {
            let { email, verificationCode } = req.body

            // Try to get temp
            let temp = await Temp.findOne({ email })
            if (!temp) { res.statusMessage = 'The verification code has expired. Please refresh the page and start over.'; res.status(409).end(); return; }

            // Check verification code
            let isMatch = await bcrypt.compare(verificationCode, temp.verificationCode)
            if (!isMatch) { res.statusMessage = 'The verification code did not match. Please check the code and try again.'; res.status(409).end(); return; }

            // Save temp to user
            let user = new User({
                email: temp.email,
                password: temp.password,
                status: 'good',
                appData: {
                    username: temp.username
                }
            })
            await user.save()

            // Delete from temp
            await Temp.findByIdAndDelete(temp.id)

            // Create new session for user, and send back user.appData
            req.session.userId = user._id
            res.json(user.appData)

        } catch (err) {
            res.statusMessage = 'There was a problem when checking the verification code'; res.status(500).end();
        }
    })

    // Login
    server.post('/login', async (req, res, next) => {
        try {
            let { email, password } = req.body

            // Validation
            if (!utils.validatePassword(password)) { res.statusMessage = 'Server detected invalid Password'; res.status(409).end(); return; }

            // Find user
            let user = await User.findOne({ email })
            if (!user) { res.statusMessage = 'Email and/or password incorrect. Please try again.'; res.status(409).end(); return; }

            // Check account status
            if (user.status === 'deleted') { res.statusMessage = 'The account you are trying to access has been deleted. Please login to a different account.'; res.status(409).end(); return; }

            // Check password
            let isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) { res.statusMessage = 'Email and/or password incorrect. Please try again.'; res.status(409).end(); return; }

            // Create new session for user, and send back user.appData
            req.session.userId = user._id
            res.json(user.appData)

        } catch (err) {
            res.statusMessage = 'A problem occured when trying to log in. Please refresh the page and try again.'; res.status(500).end();
        }
    })

    // Logout
    server.post('/logout', (req, res, next) => {
        req.session.destroy(err => {
            if (err) {
                res.statusMessage = 'There was a problem when trying to log out. Please try again later.'
                res.status(500).end()
            } else {
                res.clearCookie(config.SESSION_NAME)
                res.sendStatus(200)
            }
        })
    })

    // Delete account
    server.post('/deleteaccount', async (req, res, next) => {
        try {
            let { email, password } = req.body

            // Validation
            if (!utils.validatePassword(password)) { res.statusMessage = 'Server detected invalid Password'; res.status(409).end(); return; }

            // Find user
            let user = await User.findOne({ email })
            if (!user) { res.statusMessage = 'Email and/or password incorrect. Please try again.'; res.status(409).end(); return; }

            // Check password
            let isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) { res.statusMessage = 'Email and/or password incorrect. Please try again.'; res.status(409).end(); return; }

            // Change account status and save
            user.email = 'deleted'
            user.status = 'deleted'
            await user.save()

            // Delete from temp (edge case, where user signs up then deletes in a short period of time)
            await Temp.findOneAndDelete({ email })

            // Log out user
            req.session.destroy(err => {
                if (err) {
                    res.statusMessage = 'Account was deleted, but there was a problem logging out. Please try logging out again.'
                    res.status(500).end()
                } else {
                    res.clearCookie(config.SESSION_NAME)
                    res.sendStatus(200)
                }
            })
        } catch (err) {
            res.statusMessage = 'A problem occured when trying to delete your account. Please contact support.'; res.status(500).end();
        }
    })

    // Reset password
    server.post('/reset/password', async (req, res, next) => {
        try {
            let { email, newPassword1 } = req.body

            // Validate new password
            if (!utils.validatePassword(newPassword1)) { res.statusMessage = 'Server detected invalid Password.'; res.status(409).end(); return; }

            // Find user
            let user = await User.findOne({ email })
            if (!user) { res.statusMessage = "No account was found with that email address."; res.status(409).end(); return; }

            // Delete temp if one already exists with that email address
            await Temp.findOneAndDelete({ email })

            // Create verification code and new temp to temporarily store new password
            let verificationCode = Math.floor(Math.random() * 899999 + 100000)
            let temp = new Temp({
                email: email,
                username: user.appData.username,
                password: newPassword1,
                verificationCode: verificationCode
            })

            // Hash password and verification code, and save temp
            let pHash = await bcrypt.hash(temp.password, 10)
            let vHash = await bcrypt.hash(temp.verificationCode, 10)
            temp.password = pHash
            temp.verificationCode = vHash
            await temp.save()

            // Send verification email and respond with 200 status
            let message = "In order to change your password, we need to verify it's you making the request."
            utils.sendVerificationEmail(email, verificationCode, message)
            res.sendStatus(200)

        } catch (err) {
            console.log(err)
            res.statusMessage = 'There was a problem on the server. Please try again, or contact support.'; res.status(500).end();
        }

    })

    // Reset password verification
    server.post('/reset/password/verify', async (req, res, next) => {
        try {
            let { email, verificationCode } = req.body

            // Try to get temp
            let temp = await Temp.findOne({ email })
            if (!temp) { res.statusMessage = 'The verification code has expired. Please refresh the page and start over.'; res.status(409).end(); return; }

            // Check verification code
            let isMatch = await bcrypt.compare(verificationCode, temp.verificationCode)
            if (!isMatch) { res.statusMessage = 'The verification code did not match. Please check the code and try again.'; res.status(409).end(); return; }

            // Get user
            let user = await User.findOne({ email })
            if (!user) { res.statusMessage = 'There was a problem accessing the user account. Please try again, or contact support.'; res.status(409).end(); return; }

            // Save temp password to user password
            user.password = temp.password
            await user.save()

            // Delete from temp
            await Temp.findByIdAndDelete(temp.id)

            // Done
            res.sendStatus(200)

        } catch (err) {
            res.statusMessage = 'There was a problem when checking the verification code.'; res.status(500).end();
        }
    })

}