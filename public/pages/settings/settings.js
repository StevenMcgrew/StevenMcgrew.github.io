'use strict';

// YUI module pattern:  https://yuiblog.com/blog/2007/06/12/module-pattern/

var settings = function () {

    // Private variables:

    const stgDarkModeSwitch = document.getElementById('stgDarkModeSwitch')
    const stgAccountForm = document.getElementById('stgAccountForm')
    const stgPasswordForm = document.getElementById('stgPasswordForm')
    const stgDeleteForm = document.getElementById('stgDeleteForm')
    const stgEWarning = document.getElementById('stgEWarning')
    const stgUWarning = document.getElementById('stgUWarning')
    const stgP1Warning = document.getElementById('stgP1Warning')
    const stgP2Warning = document.getElementById('stgP2Warning')
    const stgDeleteAccountBtn = document.getElementById('stgDeleteAccountBtn')

    // Private methods:

    const onLoadCallback = function (xhr) {
        try {
            let userData = JSON.parse(xhr.response)
            if (userData.alert) {
                console.log(userData.alert)
                spa.setProperty('isLoggedIn', false)
            }
            else if (userData.error) {
                console.error('Server error:  ' + userData.error)
                spa.showAlert('Server error. Please refresh the page or try again later.')
            }
            else if (userData.email) {
                stgAccountForm.email.value = userData.email
                stgAccountForm.username.value = userData.username
            }
        } catch (err) {
            spa.showAlert('A problem occured when loading user data')
            console.error(err)
        }
    }

    const checkEmailAvailability = function (email, callback) {
        let baseUrl = window.location.origin
        let url = baseUrl + '/user/accountdata/checkemail';
        let json = JSON.stringify({ email: email })
        spa.basicNetRequest('POST', url, json, callback)
    }

    const checkEmailCallback = function (xhr) {
        if (xhr.responseText === '1') { // email is available
            stgEWarning.textContent = ''
        } else if (xhr.responseText === '0') { // email not available
            stgEWarning.textContent = ' (email already taken)'
        }
    }

    const validateUsername = function (field, label) {
        let illegalChars = /\W/; // allow letters, numbers, and underscores

        if (field.value == "") {
            label.textContent = " (must be 2 to 20 characters in length)";
            return false
        } else if ((field.value.length < 2) || (field.value.length > 20)) {
            label.textContent = " (must be 2 to 20 characters in length)";
            return false
        } else if (illegalChars.test(field.value)) {
            label.textContent = " (only letters and numbers)";
            return false
        } else {
            label.textContent = " (...)";
            checkUsernameAvailability(field.value, checkUsernameCallback);
            return true
        }
    }

    const checkUsernameAvailability = function (username, callback) {
        let baseUrl = window.location.origin
        let url = baseUrl + '/user/accountdata/checkusername/' + username;
        spa.basicNetRequest('GET', url, null, callback)
    }

    const checkUsernameCallback = function (xhr) {
        if (xhr.responseText === '1') { // username is available
            stgUWarning.textContent = ''
        } else if (xhr.responseText === '0') { // username not available
            stgUWarning.textContent = ' (name already taken)'
        }
    }

    const validatePassword1 = function (field, label) {
        let illegalChars = /[^\x20-\x5B+\x5D-\x7E]/; // any char that is not a printable ASCII char from (hexidecimal) 20 to 5B and 5D to 7E
        if (field.value == "") { label.textContent = " (must be 8 to 20 characters in length)"; return false; }
        if (illegalChars.test(field.value)) { label.textContent = " (disallowed character detected)"; return false; }
        if (field.value.length < 8 || field.value.length > 20) { label.textContent = " (must be 8 to 20 characters in length)"; return false; }
        label.textContent = ""; return true;
    }

    const validatePassword2 = function (field1, field2, label) {
        if (field1.value !== field2.value) {
            label.textContent = " (doesn't match)"
            return false
        } else {
            label.textContent = ''
            return true
        }
    }

    const submitForm = function (form, partialPath, callback) {
        const json = spa.getFormDataAsJson(form)
        const baseUrl = window.location.origin
        const url = baseUrl + partialPath
        spa.basicNetRequest('POST', url, json, callback)
    }

    const updateAccountCallback = function (xhr) {
        try {
            let json = JSON.parse(xhr.response)

            if (json.username) {
                spa.setPropertyLocalOnly('username', json.username)
                spa.showAlert('Success! Your account data has been updated.')
            } else if (json.emailSent) {
                spa.showModal('stgVerifyForm')
                stgVerifyForm.email.value = stgAccountForm.email.value
            }
        } catch (err) {
            spa.showAlert('A problem occured when trying to update your account')
            console.error(err)
        }
    }

    const verificationCallBack = function (xhr) {
        try {
            let json = JSON.parse(xhr.response)
            if (json.username) {
                spa.setPropertyLocalOnly('username', json.username)
                stgVerifyForm.reset()
                spa.hideModal('stgVerifyForm')
                spa.showAlert('Success! Your account data has been updated.')
            }
        } catch (err) {
            spa.showAlert('Account was updated on the server, but a problem occured when trying to update your browser view.')
            console.error(err)
        }
    }

    const changePasswordCallback = function (xhr) {
        stgPasswordForm.reset()
        spa.showAlert('Success! Your password has been updated.')
    }

    const deleteAccountCallback = function (xhr) {
        stgDeleteForm.reset()
        spa.hideModal('stgDeletePopup')
        spa.showAlert('Your account has been deleted. You will be redirected to the home page.')
        setTimeout(function () {
            window.location.href = window.location.origin
        }, 3000)
    }

    // Event listeners:

    spa.subscribeToEvent('propertyChanged', function (e) {
        if (settings.setView[e.propertyName]) {
            settings.setView[e.propertyName](e.propertyValue)
        }
    })

    document.getElementById('stgAlreadyHaveLink').addEventListener('click', function (e) {
        e.preventDefault()
        spa.showModal('stgVerifyForm')
    })

    stgDarkModeSwitch.addEventListener('click', function () {
        spa.setProperty('isDarkMode', stgDarkModeSwitch.checked)
    })

    stgAccountForm.email.addEventListener('change', function () {
        checkEmailAvailability(stgAccountForm.email.value, checkEmailCallback)
    })

    stgAccountForm.email.addEventListener('input', function () {
        stgEWarning.textContent = ''
    })

    stgAccountForm.username.addEventListener('input', function () {
        validateUsername(stgAccountForm.username, stgUWarning)
    })

    stgPasswordForm.newPassword.addEventListener('input', function () {
        validatePassword1(stgPasswordForm.newPassword, stgP1Warning)
    })

    stgPasswordForm.newPassword2.addEventListener('input', function () {
        stgP2Warning.textContent = ''
    })

    stgPasswordForm.newPassword2.addEventListener('change', function () {
        validatePassword2(stgPasswordForm.newPassword, stgPasswordForm.newPassword2, stgP2Warning)
    })

    stgAccountForm.addEventListener('submit', function (e) {
        e.preventDefault()
        let usernameIsValid = validateUsername(stgAccountForm.username, stgUWarning)
        if (!usernameIsValid) {
            spa.showAlert("Invalid Username.\n\n")
        } else {
            submitForm(e.currentTarget, '/user/accountdata', updateAccountCallback)
        }
    })

    stgVerifyForm.addEventListener('submit', function (e) {
        e.preventDefault()
        submitForm(e.currentTarget, '/user/accountdata/verify', verificationCallBack)
    })

    stgPasswordForm.addEventListener('submit', function (e) {
        e.preventDefault()
        let password1IsValid = validatePassword1(stgPasswordForm.newPassword, stgP1Warning)
        let password2IsValid = validatePassword2(stgPasswordForm.newPassword, stgPasswordForm.newPassword2, stgP2Warning)
        let alertText = ''

        if (!password1IsValid) { alertText += "The new password you entered is not valid.\n\n" }
        if (!password2IsValid) { alertText += "Your entry for Confirm New Password does not match your entry for New Password." }

        if (alertText) {
            spa.showAlert(alertText)
        } else {
            submitForm(e.currentTarget, '/user/accountdata/password', changePasswordCallback)
        }
    })

    stgDeleteAccountBtn.addEventListener('click', function () {
        spa.showModal('stgDeletePopup')
    })

    stgDeleteForm.addEventListener('submit', function (e) {
        e.preventDefault()
        let pWarnLabel = document.getElementById('stgDeletePasswordWarning')
        let passwordIsValid = validatePassword1(stgDeleteForm.password, pWarnLabel)
        if (!passwordIsValid) {
            spa.showAlert('Invalid password detected. Please try again.')
        }
        else {
            submitForm(stgDeleteForm, '/deleteaccount', deleteAccountCallback)
        }
    })

    document.getElementById('stgKeepBtn').addEventListener('click', function () {
        stgDeleteForm.reset()
        spa.hideModal('stgDeletePopup')
    })

        ; // IIFE for tabs
    (function () {
        let activeTabId = ''
        const switchTabs = function (e) {
            let clickedTab = e.currentTarget
            if (clickedTab.id === activeTabId) { return }
            if (activeTabId) {
                document.getElementById(activeTabId).classList.toggle('active')
                document.getElementById(activeTabId + 'Content').style.display = 'none'
            }
            clickedTab.classList.toggle('active')
            document.getElementById(clickedTab.id + 'Content').style.display = 'block'
            activeTabId = clickedTab.id
        };
        (function () {
            let tabBtns = document.getElementById('stgTabBtnsContainer').children
            for (let i = 0; i < tabBtns.length; i++) {
                let button = tabBtns.item(i)
                button.addEventListener('click', function (e) { switchTabs(e) })
            }
        })()
        document.getElementById('stgTabBtnsContainer').children.item(0).click()
    })()

    // Return an object which will contain publicly accessible properties and methods:
    return {

        onLoad: function () {
            spa.basicNetRequest('GET', '/user/accountdata', null, onLoadCallback)
        },

        setView: {

            isDarkMode: function (bool) {
                if (bool === true) {
                    stgDarkModeSwitch.checked = true
                } else {
                    stgDarkModeSwitch.checked = false
                }
            },

            isLoggedIn: function (bool) {
                if (bool === true) {
                    document.getElementById('stgLoginWarn1').style.display = 'none'
                    document.getElementById('stgLoginWarn2').style.display = 'none'
                    stgAccountForm.style.display = 'block'
                    stgPasswordForm.style.display = 'block'
                    stgDeleteAccountBtn.style.display = 'block'
                } else {
                    document.getElementById('stgLoginWarn1').style.display = 'block'
                    document.getElementById('stgLoginWarn2').style.display = 'block'
                    stgAccountForm.style.display = 'none'
                    stgPasswordForm.style.display = 'none'
                    stgDeleteAccountBtn.style.display = 'none'
                }
            }
        }

    };

}();