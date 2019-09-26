'use strict';

(function () {

    /***********************************************************
    
    Abstractions
    
    ************************************************************/

    function element(id) { return document.getElementById(id) }
    function click(element, callback) { element.addEventListener('click', function (e) { callback(e) }) }

    /***********************************************************
    
    General variables
    
    ************************************************************/

    let backdrop = element('backdrop')

    /***********************************************************
    
    Top bar buttons
    
    ************************************************************/

    let backdropForMenuPopouts = element('backdropForMenuPopouts')

    click(element('menuBtn'), function () {
        backdropForMenuPopouts.style.display = 'block'
        leftMenuPopout.style.display = 'block'
    })

    click(element('h1HomeBtn'), function () {
        // navigate to home page
    })

    click(element('accountBtn'), function () {
        backdropForMenuPopouts.style.display = 'block'
        rightMenuPopout.style.display = 'block'
    })

    click(backdropForMenuPopouts, function () {
        backdropForMenuPopouts.style.display = 'none'
        leftMenuPopout.style.display = 'none'
        rightMenuPopout.style.display = 'none'
    })

    /***********************************************************
    
    Dropdown
    
    ************************************************************/

    let itemsPanel = element('itemsPanel')

    click(element('dropdown'), function () {
        itemsPanel.style.display = 'block'
        backdrop.style.display = 'block'
    })

    click(backdrop, function () {
        itemsPanel.style.display = 'none'
        backdrop.style.display = 'none'
    })

    click(itemsPanel, function (e) {
        e.stopPropagation()
        let vehicle = e.target.dataset.vehicle
        if (vehicle) {
            element('vin').textContent = e.target.id
            element('vehicle').textContent = vehicle
        }
        itemsPanel.style.display = 'none'
        backdrop.style.display = 'none'
    })

    /***********************************************************
    
    New Vehicle
    
    ************************************************************/

    let yearDecoderDictionary = {};

    function currentYear() {
        let date = new Date();
        return date.getFullYear();
    }

    function buildYearDecoderDictionary() {
        let tenthDigitPattern = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y'];
        let startingYear = currentYear() - 27;
        let referenceYear = 2018;
        let referenceIndex = 17; // the value at tenthDigitPattern[17] is L, which is for model year 2018
        let startingIndex;

        // Figure out the index that we need to start at
        if (startingYear < referenceYear) {
            startingIndex = getStartIndexWhenLessThan(referenceIndex, referenceYear, startingYear);
        } else if (startingYear > referenceYear) {
            startingIndex = getStartIndexWhenGreaterThan(referenceIndex, referenceYear, startingYear);
        } else if (startingYear === referenceYear) {
            startingIndex = referenceIndex;
        }

        // Now we can build the dictionary with the info we obtained in the previous steps.
        let i = startingYear;
        let max = startingYear + 30;
        for (i; i < max; i++) {
            yearDecoderDictionary[tenthDigitPattern[startingIndex]] = i;
            startingIndex++;
            if (startingIndex > 29) // If we get to the end of the array, we need to go to the start of the array. (The tenth digit pattern starts over every 30 years, so we also need to start over at the start of the array.)
            {
                startingIndex = 0;
            }
        }
    }

    function getStartIndexWhenLessThan(refIndex, refYear, startYear) {
        let startIndex = refIndex - (refYear - startYear);
        if (startIndex < 0) {
            startIndex = startIndex + 30;
        }
        return startIndex;
    }

    function getStartIndexWhenGreaterThan(refIndex, refYear, startYear) {
        let startIndex = refIndex + (startYear - refYear);
        if (startIndex > 29) {
            startIndex = startIndex - 30;
        }
        return startIndex;
    }

    buildYearDecoderDictionary();

    let vinInputHandler = function () {
        vinInputBox.value = vinInputBox.value.toUpperCase();
        // Remove leading 'I' character if present
        if (vinInputBox.value[0] === 'I') {
            vinInputBox.value = vinInputBox.value.slice(1);
        }

        if (vinInputBox.value.length >= 17) {
            vinInputBox.removeEventListener('input', vinInputHandler);
            //loadingSpinner.style.display = 'block';

            let vin = vinInputBox.value;
            // Make sure VIN is only 17 characters long
            if (vin.length > 17) {
                vin = vin.slice(0, 17);
            }
            // Replace invalid VIN charaters with valid counterparts
            vin = vin.replace('I', '1').replace('O', '0');
            // Update input box with cleaned-up vin text.
            vinInputBox.value = vin;

            let year = getYearFromVin(vin);
            decodeVinAndUpdatePage(vin, year);
        }
    };

    vinInputBox.addEventListener('input', vinInputHandler);

    function getYearFromVin(vin) {
        let tenthDigit = vin[9];
        let year = yearDecoderDictionary[tenthDigit];
        return year;
    }

    function decodeVinAndUpdatePage(vin, year) {
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    console.log(request.response)
                    //setElementsWithJsonObj(vin, request.response);
                }
                else {
                    console.log(status + ' ' + statusText);
                }
                //toDoWhenVinApiReturns()
            }
        };
        request.open('GET', 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/' + vin + '?format=json&modelyear=' + year);
        request.responseType = 'json';
        request.timeout = 20000;
        request.ontimeout = function () {
            //toDoWhenVinApiReturns()
            appAlert('The request took too long. Please try again later.')
        }
        request.send();
    }

    function setElementsWithJsonObj(vin, jsonObj) {

        if (jsonObj) {

            // The API at https://vpic.nhtsa.dot.gov/api/ returns a JSON object, and
            // the data we need to sort through is located at jsonObj.Results as an array of objects.
            let dataObjects = jsonObj.Results;

            // We have to search the dataObjects by a VariableId value because of how the API data is structured,
            // and because the data isn't always in the same order.
            let year = getValueByVariableId(dataObjects, 29); // For instance, the object with VariableId 29 is where the value for "Model Year" is found.
            let make = getValueByVariableId(dataObjects, 26);
            let model = getValueByVariableId(dataObjects, 28);
            let series = getValueByVariableId(dataObjects, 34);
            let trim = getValueByVariableId(dataObjects, 38);
            let engine = getValueByVariableId(dataObjects, 13);
            let fuel = getValueByVariableId(dataObjects, 24);
            let error = getValueByVariableId(dataObjects, 143);
            clearVehicleSelectors();

            model = toTitleCase(model);
            if (error) { console.log(error) }; // The API returns an error code even for successfull decodes

            let amountOfNecessaryValues = 0;
            if (year) { amountOfNecessaryValues++ };
            if (make) { amountOfNecessaryValues++ };
            if (model) { amountOfNecessaryValues++ };
            if (engine) { amountOfNecessaryValues++ };

            if (amountOfNecessaryValues < 4) { // some necessary variables were not set

                vinInputBox.value = vin;
                if (year) { yearSelectBox.value = year; }
                if (make) { makeSelectBox.value = formatMake(make, true); }
                if (model) { modelInputBox.value = model; }
                if (engine) { engineSelectBox.value = buildEngineText(engine, null); }

                appAlert('Could not decode VIN. Please select vehicle manually.');

            } else { // all necessary variables were set

                engine = buildEngineText(engine, fuel);
                make = formatMake(make, false);
                if (!series) { series = ''; }
                if (!trim) { trim = ''; }
                series = makeEmptyStringIfDuplicate(series, model, trim);
                trim = makeEmptyStringIfDuplicate(trim, model, null);

                let vehDescription = year + ' ' +
                    make + ' ' +
                    model + ' ' +
                    series + ' ' +
                    trim + ' ' +
                    engine;

                newVehPanel.style.display = 'none';
                expandingMenuDismissPanel.style.display = "none";

                addVehicle(vin, vehDescription);
            }
        } else {
            vinInputBox.value = vin;
            appAlert('Could not decode. Make sure you entered a valid VIN.');
        }
    }

    function addNewVehicleToHeader(vin, vehDescription) {
        vinHeader.textContent = vin;
        vehHeader.textContent = vehDescription;

        newVehPanel.style.display = 'none';
        expandingMenuDismissPanel.style.display = 'none';
    }

    function addToRecentVehiclesList(vin, vehDescription) {
        let veh = recentVehTemplate.cloneNode(true);
        veh.classList.remove('recentVehTemplate');
        veh.removeAttribute('hidden');
        veh.querySelector('.vinSpan').textContent = vin;
        veh.querySelector('.vehSpan').textContent = vehDescription;
        recentVehList.insertAdjacentElement('afterbegin', veh);
        //recentVehList.appendChild(veh);
    }

    function getValueByVariableId(objects, variableId) {
        let value = '';
        for (let i = 0; i < objects.length; i++) {

            if (objects[i].VariableId == variableId) {

                let dataWeWant = objects[i].Value;
                if (dataWeWant) { value = dataWeWant };
                break;
            }
        }
        return value;
    }

    function clearVehicleSelectors() {
        yearSelectBox.selectedIndex = 0;
        makeSelectBox.selectedIndex = 0;
        modelInputBox.value = '';
        engineSelectBox.selectedIndex = 0;
        vinInputBox.value = '';
    }

    function toTitleCase(str) {
        if (!str) {
            str = '';
            return str;
        } else {
            // Initial title case method.
            str = str.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
                return txt[0].toUpperCase() + txt.slice(1).toLowerCase();
            });
            // Make these words lower case unless they are the first word in the title.
            let lowers = ['A', 'An', 'The', 'And', 'But', 'Or', 'For', 'Nor', 'As', 'At', 'By', 'For', 'From', 'In', 'Into', 'Near', 'Of', 'On', 'Onto', 'To', 'With'];
            for (let i = 0, j = lowers.length; i < j; i++) {
                str = str.replace(new RegExp('\\s' + lowers[i] + '\\s', 'g'), function (txt) {
                    return txt.toLowerCase();
                });
            }
            // Make these words upper case (things such as acronyms).
            let uppers = ['Id', 'Tv', 'Bmw', 'Mini', 'Gmc'];
            for (let i = 0, j = uppers.length; i < j; i++) {
                str = str.replace(new RegExp('\\b' + uppers[i] + '\\b', 'g'),
                    uppers[i].toUpperCase());
            }
            return str;
        }
    }

    function formatMake(make, forMatching) {
        make = make.toLowerCase();
        if (make.slice(0, 2) == 'al') { make = 'alfa romeo'; } // if make starts with 'al' (this is to handle an edge case for Alfa Romeo)
        if (!forMatching) { make = toTitleCase(make); } // if not for matching to dropdown menu value, then title case it
        return make;
    }

    function buildEngineText(engine, fuel) {
        engine = parseFloat(engine);
        engine = engine.toFixed(1);
        engine = engine + 'L';
        if (fuel) {

            if (fuel[0] === 'D' || fuel[0] === 'd') {

                engine = engine + ' Dsl';
            }
        }
        return engine;
    }

    function makeEmptyStringIfDuplicate(str, str1, str2) {
        let str0 = str.toLowerCase();
        str1 = str1.toLowerCase();
        // if str1 contains str0 or vice versa, then make str empty
        if (~str1.indexOf(str0)) { str = ''; }
        if (~str0.indexOf(str1)) { str = ''; }
        if (str2) {
            str2 = str2.toLowerCase();
            // if str2 contains str0 or vice versa, then make str empty
            if (~str2.indexOf(str0)) { str = ''; }
            if (~str0.indexOf(str2)) { str = ''; }
        }
        return str;
    }

    function toDoWhenVinApiReturns() {
        vinInputBox.addEventListener('input', vinInputHandler);
        loadingSpinner.style.display = 'none';
    }

    submitBtn.addEventListener('click', function (e) {
        let vin = vinInputBox.value;
        let year = yearSelectBox.value;
        let make = toTitleCase(makeSelectBox.value);
        let model = modelInputBox.value;
        let engine = engineSelectBox.value;

        if (year == 'Year' || make == 'Make' || !model || engine == 'Engine') {
            appAlert('Must make a selection for each field: Year, Make, Model, and Engine');
            return;
        }

        if (!vin) { vin = 'MYREPAIRSONLINE..' };

        let vehDescription = year + ' ' +
            make + ' ' +
            model + ' ' +
            engine;

        clearVehicleSelectors();
        // Hide "pop-up" panels
        expandingMenuDismissPanel.style.display = "none";
        newVehPanel.style.display = "none";

        addVehicle(vin, vehDescription);
    });

    resetBtn.addEventListener('click', function () {
        clearVehicleSelectors();
    });


})()