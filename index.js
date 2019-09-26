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
    let newVehPanel = element('newVehPanel')

    /***********************************************************
    
    Top bar buttons
    
    ************************************************************/

    click(element('menuBtn'), function () {
        // open menu panel
    })

    click(element('h1HomeBtn'), function () {
        // navigate to home page
    })

    click(element('accountBtn'), function () {
        // open account options panel
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
        newVehPanel.style.display = 'none'
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

    click(element('newVehicleBtn'), function () {
        newVehPanel.style.display = 'block';
        backdrop.style.display = 'block'
    })

})()