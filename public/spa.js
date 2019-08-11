'use strict';

// YUI module pattern:  https://yuiblog.com/blog/2007/06/12/module-pattern/

var spa = function () {

    // Private variables:

    let previousURL = ''
    let timeOfLastUserDataFetch = 0
    let eventCollection = {}

    // Private methods:

    const logoutCallback = function (xhr) {
        window.location.href = window.location.origin
        //spa.showToast('Logged out', '✔️', 'green')
    }

    const loadStyle = function (id, href) {
        const existingStyle = document.getElementById(id)
        if (!existingStyle) { // Only create and load a new one if it does not exist yet.
            let link = document.createElement('link')
            link.rel = 'stylesheet'
            link.type = 'text/css'
            link.id = id
            link.href = href
            document.getElementsByTagName('head')[0].appendChild(link)
        }
    }

    const loadScript = function (id, src) {
        const existingScript = document.getElementById(id)
        if (!existingScript) { // Only create and load a new one if it does not exist yet.
            let firstScript = document.getElementsByTagName('script')[0] // The reason why we look for the first script element instead of head or body is because some browsers don't create one if missing
            let script = document.createElement('script')
            script.id = id
            script.src = src
            script.onload = function () {
                loadUserData(true)
                hideLoader()
            }
            firstScript.parentNode.insertBefore(script, firstScript)
        }
    }

    const loadUserData = function (lazyMode) {
        // Only fetch data if it's been over 5 mins since last fetch
        if (lazyMode && (Date.now() - timeOfLastUserDataFetch < 300000)) {
            spa.setViewPerScope(getPageIdFromUrl(window.location.href))
        } else {
            timeOfLastUserDataFetch = Date.now() // Set this for the next time we need to check it
            spa.basicNetRequest('GET', '/user/appdata', null, spa.loadUserDataCallback)
        }
    }

    const getPageIdFromUrl = function (str) {
        // In case of trailing '/' characters, remove them
        while (str.slice(-1) == '/') {  // while the last char is '/'
            str = str.slice(0, -1);     // remove the last char
        }
        str = str.substr(str.lastIndexOf('/') + 1); // Now we can get the last segment of the url pathname
        str = str.substring(0, str.lastIndexOf('.')) || str; // Trims off the file extension at the last '.'
        return str;
    }

    const loadPage = function (xhr, pagePath, id) {
        if (xhr.status === 200) { // Response OK
            let div = document.createElement('div')
            div.id = id
            div.innerHTML = xhr.responseText
            document.getElementById('spaPageArea').appendChild(div)

            // Update this here for the next time we need to check the previous URL
            previousURL = window.location.href

            let trimmedPath = pagePath.substring(0, pagePath.lastIndexOf('/')) || pagePath; // trims off the last segment of the path at the last '/'
            loadStyle(id + 'Style', trimmedPath + '/' + id + '.css')
            loadScript(id + 'Script', trimmedPath + '/' + id + '.js')
        } else if (xhr.status == 0) {
            spa.showAlert('Unable to connect to the network at this time')
            if (previousURL) { window.location.href = previousURL }
        }
        else { // Some other problem (like 404 Not found)
            spa.showAlert(xhr.status + ' - ' + xhr.statusText)
            if (previousURL) { window.location.href = previousURL }
        }
    }

    const userAppDataUpdateCallback = function (xhr) {
        // This is called when general app settings are changed.
        try {
            let userData = JSON.parse(xhr.response)
            if (userData.alert) {
                console.log(userData.alert)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const showLoader = function () {
        let modalBackdrop = spa.showModal('spaLoadingText', true, true, '0')
        modalBackdrop.classList.add('spaFadeInWithDelay')
    }

    const hideLoader = function () {
        spa.hideModal('spaLoadingText')
    }

    // Event Listeners:

    document.getElementById('spaLogoutBtn').addEventListener('click', function (e) {
        e.preventDefault()
        spa.basicNetRequest('POST', '/logout', null, logoutCallback)
    })

    document.getElementById('spaAlertOkBtn').addEventListener('click', function (e) {
        spa.hideModal('spaAlertBox')
        document.getElementById('spaAlertText').textContent = ''
    })

    window.addEventListener('hashchange', function () {

        // Show loading notification (animation has a delay before it shows)
        showLoader()

        // Check for previous page, and hide it if there is one
        if (previousURL) { // The previousURL is set manually in code because IE doesn't support oldURL/newURL for the hashchange event
            let previousPageId = getPageIdFromUrl(previousURL)
            let previousPage = document.getElementById(previousPageId)
            if (previousPage) { previousPage.style.display = 'none' }
            if (window[previousPageId].onUnload) { window[previousPageId].onUnload() }
        }

        // Check if the requested page is already loaded and show it, otherwise fetch it
        let requestedPageId = getPageIdFromUrl(window.location.href)
        let requestedPage = document.getElementById(requestedPageId)
        if (requestedPage) {
            requestedPage.style.display = 'block'
            if (window[requestedPageId].onLoad) { window[requestedPageId].onLoad() }
            hideLoader()
            // Update this for the next time
            previousURL = window.location.href
        }
        else {
            let pagePath = window.location.hash.replace('#', '')
            spa.complexNetRequest('GET', pagePath, null, function (xhr) {
                loadPage(xhr, pagePath, requestedPageId)
            })
        }
    })

    // Return an object which will contain publicly accessible properties and methods:
    return {

        showModal: function (contentId, hideCloseBtn, preventLightDismiss, opacity, backdropColor) {

            // Get a reference to the content
            let content = document.getElementById(contentId)

            // If content is already in a modal, then we need to remove it first (multiple modals are allowed, but not of the same content. The developer would need to clone thier content and give it a unique id)
            if (content.dataset.modalNumber) { spa.hideModal(contentId) }

            // Clone the modal elements (only the modalCloseBtn deep copy is set to true)
            let modalBackdrop = document.getElementById('modalBackdrop').cloneNode(false)
            let modalWindow = document.getElementById('modalWindow').cloneNode(false)
            let modalCloseBtn = document.getElementById('modalCloseBtn').cloneNode(true)
            let modalContentContainer = document.getElementById('modalContentContainer').cloneNode(false)

            // Create unique id to append to current id's
            let timestamp = Date.now()
            let uniqueId = '_' + timestamp

            // Append the unique id to the modal elements
            modalBackdrop.id += uniqueId
            modalWindow.id += uniqueId
            modalCloseBtn.id += uniqueId
            modalContentContainer.id += uniqueId

            // Store some data in the dataset attributes
            let contentParent = content.parentElement
            if (!contentParent.id) { contentParent.id = Date.now() }
            content.dataset.originalParentId = contentParent.id
            content.dataset.modalNumber = timestamp
            modalBackdrop.dataset.contentId = contentId
            modalCloseBtn.dataset.contentId = contentId

            // Add some event listeners
            modalCloseBtn.addEventListener('click', function (e) { spa.hideModal(e.currentTarget.dataset.contentId) })
            modalWindow.addEventListener('click', function (e) { e.stopPropagation() })

            // Move the content into the modalContentContainer
            contentParent.removeChild(content)
            modalContentContainer.appendChild(content)

            // Adjust color for darkMode setting
            let darkMode = JSON.parse(localStorage.getItem('isDarkMode'))
            if (darkMode) { modalWindow.style.backgroundColor = 'rgb(19, 19, 19)' }
            else { modalWindow.style.backgroundColor = 'white' }

            // Make changes if optional function parameters were set
            if (!preventLightDismiss) { modalBackdrop.addEventListener('click', function (e) { spa.hideModal(e.currentTarget.dataset.contentId) }) }
            if (hideCloseBtn) { modalCloseBtn.style.display = 'none' }
            if (opacity) { modalBackdrop.style.opacity = opacity }
            if (backdropColor) { modalBackdrop.style.backgroundColor = backdropColor }

            // Nest the elements together
            modalBackdrop.appendChild(modalWindow)
            modalWindow.appendChild(modalCloseBtn)
            modalWindow.appendChild(modalContentContainer)

            // Make sure the content and modal will be visible
            content.style.display = 'block'
            modalBackdrop.style.display = 'block'

            // Show the created modal by appending it to the DOM
            document.body.appendChild(modalBackdrop)

            return modalBackdrop
        },

        hideModal: function (contentId) {

            // Get a reference to the elements we are working with
            let content = document.getElementById(contentId)
            let originalParent = document.getElementById(content.dataset.originalParentId)
            let modalBackdrop = document.getElementById('modalBackdrop_' + content.dataset.modalNumber)
            let modalContentContainer = document.getElementById('modalContentContainer_' + content.dataset.modalNumber)

            // Hide the stuff
            modalBackdrop.style.display = 'none'
            content.style.display = 'none'

            // Remove the dataset attributes for the content
            content.removeAttribute('data-original-parent-id')
            content.removeAttribute('data-modal-number')

            // Move content back to orignal parent
            modalContentContainer.removeChild(content)
            originalParent.appendChild(content)

            // Remove the cloned modal from the DOM
            modalBackdrop.parentElement.removeChild(modalBackdrop)
        },

        setProperty: function (name, value) {
            // Check if the property value has been set in the past, and check if the value is the same. If so, then we don't need to do set it again, so just return.
            let propValue = JSON.parse(localStorage.getItem(name))
            if (propValue !== null) {
                if (propValue === value) { return }
            }

            spa.publishEvent('propertyChanged', { propertyName: name, propertyValue: value })
            localStorage.setItem(name, JSON.stringify(value))
            let json = JSON.stringify({ propName: name, propValue: value })
            spa.basicNetRequest('POST', '/user/appdata', json, userAppDataUpdateCallback)
        },

        setPropertyLocalOnly: function (name, value) {
            spa.publishEvent('propertyChanged', { propertyName: name, propertyValue: value })
            localStorage.setItem(name, JSON.stringify(value))
        },

        initializeApp: function (defaultPagePath) {

            // Subscribe to property changes for the spa
            spa.subscribeToEvent('propertyChanged', function (e) {
                if (spa.setView[e.propertyName]) {
                    spa.setView[e.propertyName](e.propertyValue)
                }
            })

            // isLoggedIn is always false on start-up, then checked for login status later
            spa.setPropertyLocalOnly('isLoggedIn', false)

            // Set the initial view of the spa
            spa.setViewPerScope('spa')

            // If refresh, load same page. Else, hashchange to home page (default page).
            let currentPagePath = window.location.hash.replace('#', '');
            if (currentPagePath) {
                previousURL = window.location.href;  // Need to set this here because page refreshes don't have a hashchange event
                showLoader() // Need to call this here because page refreshes don't have a hashchange event
                let pageId = getPageIdFromUrl(window.location.href);
                spa.complexNetRequest('GET', currentPagePath, null, function (xhr) {
                    loadPage(xhr, currentPagePath, pageId)
                })
            } else {
                window.location.hash = defaultPagePath;
            }
        },

        subscribeToEvent: function (eventName, listenerFunction) {
            if (!eventCollection.hasOwnProperty(eventName)) eventCollection[eventName] = [];  // Create the event which will be an array of listener functions
            let index = eventCollection[eventName].push(listenerFunction) - 1;  // Add the listenerFunction to the array, and store the index number to a variable
            return { // Return an object containing a function to be used for removing the listener function
                remove: function () {
                    delete eventCollection[eventName][index];
                }
            };
        },

        publishEvent: function (eventName, eventDataObject) {
            if (!eventCollection.hasOwnProperty(eventName)) return;  // If the event doesn't exist then just return.
            eventCollection[eventName].forEach(function (listenerFunction) { // Loop through array of functions for that eventName and call them.
                listenerFunction(eventDataObject != undefined ? eventDataObject : {});
            });
        },

        complexNetRequest: function (method, url, json, callback) {
            let xhr = new XMLHttpRequest()
            xhr.open(method, url)
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (callback) {
                        callback(xhr)
                    }
                }
            }
            if (json) {
                xhr.setRequestHeader("Content-Type", "application/json")
                xhr.send(json)
            } else {
                xhr.send()
            }
        },

        basicNetRequest: function (method, url, json, callback) {
            let xhr = new XMLHttpRequest()
            xhr.open(method, url, true)
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        if (callback) { callback(xhr) }
                    }
                    else if (xhr.status === 0) { spa.showAlert('No response from server. Check network connection.') }
                    else { spa.showAlert(xhr.statusText) } // Some other problem (like 404 Not found)
                }
            }
            if (json) {
                xhr.setRequestHeader("Content-Type", "application/json")
                xhr.send(json)
            } else {
                xhr.send()
            }
        },

        getFormDataAsJson: function (form) {
            let data = {}
            for (let i = 0; i < form.length; i++) {
                let input = form[i];
                if (input.name) {
                    if (input.type === 'checkbox') { data[input.name] = input.checked }
                    else { data[input.name] = input.value }
                }
            }
            return JSON.stringify(data)
        },

        loadUserDataCallback: function (xhr) {
            try {
                let userDataJSON = JSON.parse(xhr.response) // xhr.response should contain user's appData object, or an alert message
                if (userDataJSON.alert) {
                    console.log(userDataJSON.alert)
                    spa.setPropertyLocalOnly('isLoggedIn', false)
                }
                else if (userDataJSON.username) {
                    Object.keys(userDataJSON)
                        .forEach(function (key) {
                            let value = userDataJSON[key]
                            spa.setPropertyLocalOnly(key, value)
                        })
                    spa.setPropertyLocalOnly('isLoggedIn', true)
                }
            } catch (err) {
                spa.showAlert('A problem occured when loading user data')
                spa.setPropertyLocalOnly('isLoggedIn', false)
                console.error(err)
            } finally {
                spa.setViewPerScope('spa')
                spa.setViewPerScope(getPageIdFromUrl(window.location.href))
            }
        },

        setViewPerScope: function (scope) {
            let currentPage = window[scope]
            if (currentPage) {

                console.log('setViewPerScope:  ' + scope)

                if (currentPage.onLoad) { currentPage.onLoad() }
                if (currentPage.hasOwnProperty('setView')) {  // If the page or spa has setView properties, we need to run the setView methods associated with those properties
                    let viewMethods = window[scope]['setView']; // Get the setView methods for the current page or the spa
                    for (let methodName in viewMethods) {             // Get ready to loop through the setView methods
                        let propValue = JSON.parse(localStorage.getItem(methodName))
                        if (propValue !== null) {        // Check if a value for the property is stored (no value is stored if the property hasn't ever been set)
                            viewMethods[methodName](propValue); // Call the method name with the value that is stored
                        }
                    }
                }
            }
        },

        showAlert: function (alertString) {
            document.getElementById('spaAlertText').textContent = alertString
            spa.showModal('spaAlertBox', true)
        },

        showToast: function (toastString, unicodeIcon, iconColor) {
            let toast = document.getElementById('spaToast')
            let message = document.getElementById('spaToastMessage')
            let icon = document.getElementById('spaToastUnicodeIcon')

            message.textContent = toastString

            if (unicodeIcon) {
                icon.textContent = unicodeIcon;
                icon.style.fontSize = '25px';
            }
            if (iconColor) {
                icon.style.color = iconColor
            }

            toast.classList.toggle('spaShow')
            setTimeout(function () {
                toast.classList.toggle('spaShow')
                message.textContent = ''
                icon.textContent = ''
                icon.style.color = 'inherit'
                icon.style.fontSize = 'inherit'
            }, 2000) // /* If you change time duration here, you have to change it in css as well
        },

        setView: {

            isDarkMode: function (bool) {
                if (bool === true) {
                    document.body.style.backgroundColor = 'rgb(61, 61, 61)'
                    document.body.style.color = 'white'
                } else {
                    document.body.style.backgroundColor = 'white'
                    document.body.style.color = 'black'
                }
            },

            username: function (string) {
                let spaUserBtn = document.getElementById('spaUserBtn')
                if (!string || string == ' ') {
                    spaUserBtn.style.visibility = 'hidden'
                    spaUserBtn.innerHTML = ' ';
                } else {
                    spaUserBtn.style.visibility = 'visible'
                    spaUserBtn.innerHTML = string;
                }
            },

            isLoggedIn: function (bool) {
                let spaLogoutBtn = document.getElementById('spaLogoutBtn')
                let spaLoginBtn = document.getElementById('spaLoginBtn')
                let spaSignupBtn = document.getElementById('spaSignupBtn')
                if (bool === true) {
                    spaLoginBtn.style.display = 'none'
                    spaSignupBtn.style.display = 'none'
                    spaLogoutBtn.style.display = 'inline-block'
                } else if (bool === false) {
                    spaLoginBtn.style.display = 'inline-block'
                    spaSignupBtn.style.display = 'inline-block'
                    spaLogoutBtn.style.display = 'none'
                    spa.setPropertyLocalOnly('username', ' ')
                }
            }

        }

    };

}()
//
//   Initialize the app by calling the following function with the path to the first page you want to load
//
spa.initializeApp('pages/home/home.html')