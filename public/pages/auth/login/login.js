'use strict';

// YUI module pattern:  https://yuiblog.com/blog/2007/06/12/module-pattern/

var login = function () {

    // Private variables:

    const lgnForm = document.getElementById('lgnLoginForm')

    // Private methods:

    const loginCallback = function (xhr) {
        window.location.href = window.location.origin;
}

    const submitForm = function (form, partialPath, callback) {
        const json = spa.getFormDataAsJson(form)
        const baseUrl = window.location.origin
        const url = baseUrl + partialPath
        spa.basicNetRequest('POST', url, json, callback)
    }

    const createWarningIfInvalidPassword = function (password) {
        let warning = ''
        let illegalChars = /[^\x20-\x5B+\x5D-\x7E]/; // any char that is not a printable ASCII char from (hexidecimal) 20 to 5B and 5D to 7E
        if (password.length < 8 || password.length > 20 || illegalChars.test(password)) {
            warning = "Invalid Password."
        }
        return warning
    }

    // Event listeners:

    lgnForm.addEventListener('submit', function (e) {
        e.preventDefault()
        let validationWarning = createWarningIfInvalidPassword(lgnForm.password.value)
        if (validationWarning) {
            spa.showAlert(validationWarning)
        } else {
            submitForm(e.currentTarget, '/login', loginCallback)
        }
    })

    // Return an object which will contain publicly accessible properties and methods:
    return {

        onLoad: function() {
            spaLoginBtn.style.display = 'none'
        },

        onUnload: function() {
            spaLoginBtn.style.display = 'inline-block'
        }

    };

}();