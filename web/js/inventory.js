let inventoryContainer = document.querySelector(".inventory-container");

(() => {
    for(let i = 0; i < 28; i++) {
        let inventoryRow = "<div class='horizontal'>"
        for(let k = 0; k < 10; k++) {
            inventoryRow += `<div>${k + 1}</div>`
        }
        inventoryRow += "</div>"
        inventoryContainer.innerHTML += inventoryRow
    }
})();