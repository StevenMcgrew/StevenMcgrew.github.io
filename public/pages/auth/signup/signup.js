'use strict';

// YUI module pattern:  https://yuiblog.com/blog/2007/06/12/module-pattern/

var signup = function () {

    // Private variables:

    const supVerifyForm = document.getElementById('supVerifyForm')
    const supSignupForm = document.getElementById('supSignupForm')
    const supEwarning = document.getElementById('supEwarning')
    const supUwarning = document.getElementById('supUwarning')
    const supPwarning = document.getElementById('supPwarning')
    const supP2warning = document.getElementById('supP2warning')

    // Private methods:

    const verificationCallBack = function (xhr) {
        spa.loadUserDataCallback(xhr)
        supVerifyForm.reset()
        supSignupForm.reset()
        spa.hideModal('supVerifyForm')
        spa.showAlert('Success! You will be redirected to the home page now.')
        setTimeout(function () {
            window.location.hash = 'pages/home/home.html'
        }, 3000)
    }

    const signupCallback = function (xhr) {
        spa.showModal('supVerifyForm')
        supVerifyForm.email.value = supSignupForm.email.value
    }

    const submitForm = function (form, partialPath, callback) {
        const json = spa.getFormDataAsJson(form)
        const baseUrl = window.location.origin
        const url = baseUrl + partialPath
        spa.basicNetRequest('POST', url, json, callback)
    }

    const checkEmailAvailability = function (email, callback) {
        let baseUrl = window.location.origin
        let url = baseUrl + '/signup/checkemail';
        let json = JSON.stringify({ email: email })
        spa.basicNetRequest('POST', url, json, callback)
    }

    const checkEmailCallback = function (xhr) {
        if (xhr.responseText === '1') { // email is available
            supEwarning.textContent = ''
        } else if (xhr.responseText === '0') { // email not available
            supEwarning.textContent = ' (already taken, try another address)'
        }
    }

    const checkUsernameAvailability = function (username, callback) {
        let baseUrl = window.location.origin
        let url = baseUrl + '/signup/checkusername/' + username;
        spa.basicNetRequest('GET', url, null, callback)
    }

    const checkUsernameCallback = function (xhr) {
        if (xhr.responseText === '1') { // username is available
            supUwarning.textContent = ''
        } else if (xhr.responseText === '0') { // username not available
            supUwarning.textContent = ' (already taken, try another name)'
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

    const validatePassword = function (field, label) {
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

    // Event listeners:

    document.getElementById('supAlreadyHaveLink').addEventListener('click', function (e) {
        e.preventDefault()
        spa.showModal('supVerifyForm')
    })

    supVerifyForm.addEventListener('submit', function (e) {
        e.preventDefault()
        submitForm(e.currentTarget, '/signup/verify', verificationCallBack)
    })

    supSignupForm.addEventListener('submit', function (e) {
        e.preventDefault()
        let usernameIsValid = validateUsername(supSignupForm.username, supUwarning)
        let passwordIsValid = validatePassword(supSignupForm.password, supPwarning)
        let password2IsValid = validatePassword2(supSignupForm.password, supSignupForm.password2, supP2warning)
        let alertText = ''

        if (!usernameIsValid) { alertText += "Invalid Username.\n\n" }
        if (!passwordIsValid) { alertText += "Invalid Password.\n\n" }
        if (!password2IsValid) { alertText += "The confirmation password doesn't match." }

        if (alertText) {
            spa.showAlert(alertText)
        } else {
            submitForm(e.currentTarget, '/signup/temp', signupCallback)
        }
    })

    supSignupForm.email.addEventListener('change', function () {
        checkEmailAvailability(supSignupForm.email.value, checkEmailCallback)
    })

    supSignupForm.email.addEventListener('input', function () {
        supEwarning.textContent = ''
    })

    supSignupForm.username.addEventListener('input', function () {
        validateUsername(supSignupForm.username, supUwarning)
    })

    supSignupForm.password.addEventListener('input', function () {
        validatePassword(supSignupForm.password, supPwarning)
    })

    supSignupForm.password2.addEventListener('input', function () {
        supP2warning.textContent = ''
    })

    supSignupForm.password2.addEventListener('change', function () {
        validatePassword2(supSignupForm.password, supSignupForm.password2, supP2warning)
    })

    // Return an object which will contain publicly accessible properties and methods:
    return {

    };

}();