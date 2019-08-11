'use strict';

// YUI module pattern:  https://yuiblog.com/blog/2007/06/12/module-pattern/

var resetpassword = function () {

    // Private variables:

    const rpwResetPasswordForm = document.getElementById('rpwResetPasswordForm')
    const rpwP1Warning = document.getElementById('rpwP1Warning')
    const rpwP2Warning = document.getElementById('rpwP2Warning')

    // Private methods:

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

    const resetPasswordCallback = function (xhr) {
        spa.showModal('rpwVerifyForm')
        rpwVerifyForm.email.value = rpwResetPasswordForm.email.value
    }

    const verificationCallBack = function (xhr) {
        rpwVerifyForm.reset()
        rpwResetPasswordForm.reset()
        spa.hideModal('rpwVerifyForm')
        spa.showAlert('Success! You will be redirected to the login page now.')
        setTimeout(function () {
            window.location.hash = 'pages/auth/login/login.html'
        }, 3000)
    }

    // Event listeners:

    document.getElementById('rpwAlreadyHaveLink').addEventListener('click', function (e) {
        e.preventDefault()
        spa.showModal('rpwVerifyForm')
    })

    rpwVerifyForm.addEventListener('submit', function (e) {
        e.preventDefault()
        submitForm(e.currentTarget, '/reset/password/verify', verificationCallBack)
    })

    rpwResetPasswordForm.newPassword1.addEventListener('input', function () {
        validatePassword1(rpwResetPasswordForm.newPassword1, rpwP1Warning)
    })

    rpwResetPasswordForm.newPassword2.addEventListener('input', function () {
        rpwP2Warning.textContent = ''
    })

    rpwResetPasswordForm.newPassword2.addEventListener('change', function () {
        validatePassword2(rpwResetPasswordForm.newPassword1, rpwResetPasswordForm.newPassword2, rpwP2Warning)
    })

    rpwResetPasswordForm.addEventListener('submit', function (e) {
        e.preventDefault()
        let password1IsValid = validatePassword1(rpwResetPasswordForm.newPassword1, rpwP1Warning)
        let password2IsValid = validatePassword2(rpwResetPasswordForm.newPassword1, rpwResetPasswordForm.newPassword2, rpwP2Warning)
        let alertText = ''

        if (!password1IsValid) { alertText += "The new password you entered is not valid.\n\n" }
        if (!password2IsValid) { alertText += "Your entry for Confirm New Password does not match your entry for New Password." }

        if (alertText) {
            spa.showAlert(alertText)
        } else {
            submitForm(e.currentTarget, '/reset/password', resetPasswordCallback)
        }
    })


    // Return an object which will contain publicly accessible properties and methods:
    return {

    };

}();