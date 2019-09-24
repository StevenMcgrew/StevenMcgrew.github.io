'use strict';
// IIFE for Dropdown
(function () {

    let itemsPanel = document.getElementById('itemsPanel')
    let backdrop = document.getElementById('backdrop')

    document.getElementById('dropdown').addEventListener('click', function () {
        itemsPanel.style.display = 'block'
        backdrop.style.display = 'block'
    })

    backdrop.addEventListener('click', function () {
        itemsPanel.style.display = 'none'
        backdrop.style.display = 'none'
    })

    itemsPanel.addEventListener('click', function (e) {
        e.stopPropagation()
        document.getElementById('selectedItem').textContent = e.target.textContent
        itemsPanel.style.display = 'none'
        backdrop.style.display = 'none'
    })

})()