updateOutput = function () {
    output = document.getElementById("output")
    output.value = ""
    let newOutput = []
    let templateData = templates[templateID]
    for (field in templateData.fields) {
        let fieldOutput = ""
        if (templateData["fields"][field].type == "text" || templateData["fields"][field].type == "largetext" || templateData["fields"][field].type == "dropdown") {
            if (document.getElementsByName(field)[0].value == "") {
                fieldOutput = field + ": N/A"
            } else {
                fieldOutput = field + ": " + document.getElementsByName(field)[0].value
            }
        } else if (templateData["fields"][field].type == "bool") {
            if (document.getElementsByName(field)[0].checked) {
                fieldOutput = field + ": yes"
            } else {
                fieldOutput = field + ": no"
            }
        }
        newOutput.push(fieldOutput)
    }
    for (x of newOutput) {
        output.value = output.value + x + "\n"
    }
    output.value = output.value.substring(0, output.value.length - 1) // remove trailing newline. might want to make this a setting eventually. (you're welcome jaren)
    output.style.height = "" // https://stackoverflow.com/questions/2803880/is-there-a-way-to-get-a-textarea-to-stretch-to-fit-its-content-without-using-php
    output.style.height = output.scrollHeight + "px"
}
clear = function () {
  openTemplate(parseInt(templateID))
}
openTemplate = function (template) {
    if (Number.isInteger(template)) { // Being passed a template ID, no need to extract it
        templateID = template
    } else {
        if (template.target.classList.contains("favorite-button")) {
            return // The user is just trying to toggle a favorite, don't actually do anything
        }
        templateID = template.target.id
    } 
    collapseDropdown()
    document.getElementById("template").innerHTML = ""
    for (field in templates[templateID]["fields"]) {
        fieldData = templates[templateID]["fields"][field]
        fieldDiv = document.createElement("div")
        fieldDiv.classList.add("fieldDiv")
        let label = document.createElement("h3")
        label.innerText = field
        fieldDiv.appendChild(label)
        let description = fieldData.description
        if (description != undefined) {
            if (fieldData.type != "text" && fieldData.type != "largetext") {
                let descriptionNode = document.createElement("p")
                descriptionNode.innerText = fieldData.description
                fieldDiv.appendChild(descriptionNode)
            }
        }
        if (fieldData.type == "text" || fieldData.type == "largetext") {
            let input = undefined
            if (fieldData.type == "text"){
                input = document.createElement("input")
                input.type = "text"
            } else {
                input = document.createElement("textarea")
            }
            if (fieldData.description != undefined) {
                input.placeholder = fieldData.description
            }
            input.oninput = updateOutput // uses oninput instead of onkeyup to account for updates caused by autocorrect, undo via context menu, etc
            input.name = field
            fieldDiv.appendChild(input)
        }
        if (fieldData.type == "dropdown") {
            let dropdown = document.createElement("select")
            dropdown.name = field
            dropdown.onchange = updateOutput
            for (value of fieldData.value) {
                let option = document.createElement("option")
                option.value = value
                option.innerText = value
                dropdown.appendChild(option)
            }
            fieldDiv.appendChild(dropdown)
        }
        if (fieldData.type == "bool") {
            let tickbox = document.createElement("input")
            tickbox.onchange = updateOutput
            tickbox.name = field
            tickbox.type = "checkbox"
            fieldDiv.appendChild(tickbox)
        }
        if (fieldData.type == "void") {
            // Do nothing, we can add handling here later if nessisary
        }
        document.getElementById("template").appendChild(fieldDiv)
    }
    updateOutput()
    document.getElementById("template-title").innerText = templates[templateID].name
    //document.getElementById("description").style.display = "block" note to self: make this not aligned weird and re-enable it at some point
    document.getElementById("description").innerText = templates[templateID].description
}
dropdown = false
expandDropdown = function () {
    document.getElementById("arrow-down").style.display = "none"
    document.getElementById("arrow-up").style.display = "block"
    document.getElementById("selection").style.borderBottomLeftRadius = "0"
    document.getElementById("selection").style.borderBottomRightRadius = "0"
    document.getElementById("dropdown").style.display = "block"
    document.getElementById("template-title").style.display = "none"
    document.getElementById("search").style.display = "block"
    document.getElementById("search").focus()
    document.getElementById("search").select()
    document.getElementById("search").value = ""
    document.getElementById("selection").style.paddingBottom = "20px" // for some reason, overflow-y: scroll creates a gap under the selection bar in firefox
    updateSearch() // slightly jank way to unhide anything hidden in a previous search
    dropdown = true
}
collapseDropdown = function () {
    document.getElementById("arrow-down").style.display = "block"
    document.getElementById("arrow-up").style.display = "none"
    document.getElementById("selection").style.removeProperty("border-bottom-left-radius")
    document.getElementById("selection").style.removeProperty("border-bottom-right-radius")
    document.getElementById("dropdown").style.display = "none"
    document.getElementById("template-title").style.display = "inline-block"
    document.getElementById("search").style.display = "none"
    document.getElementById("selection").style.paddingBottom = "15px" // for some reason, overflow-y: scroll creates a gap under the selection bar in firefox
    dropdown = false
}
toggleDropdown = function () {
    if (dropdown) {
        collapseDropdown()
    } else {
        expandDropdown()
    }
}

window.onload = function () {
        document.getElementById("clear").onclick = clear // for some reason doing this in onclick in the html does not work
        // load favorites
        favorites = []
        if (localStorage.favorites == undefined || localStorage.favorites == "") { // if the user is visiting the page for the first time, create favorites. If they have no favorites, leave favorites empty
            localStorage.favorites = []
            favorites = []
        } else {
            for (favorite of localStorage.favorites.split(",")) { // you can't store lists in localStorage and it gets converted to a list of strings when you import it
                favorites.push(parseInt(favorite))
            }
        }
    output.value = "" // somehow this doesnt clear on its own sometimes
    // get the template list
    let req = new XMLHttpRequest()
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            templates = JSON.parse(req.responseText)
            for (index in templates) {
                let templateLink = document.createElement("span")
                let favorite = document.createElement("img")
                favorite.onclick = toggleFavorite
                if (favorites.includes(parseInt(index))) {
                    favorite.src = "stars/star2.svg"
                } else {
                    favorite.src = "stars/star1.svg"
                }
                favorite.style.width = "1%"
                favorite.style.marginRight = "3mm"
                favorite.classList.add("favorite-button")
                templateLink.appendChild(favorite)
                templateLink.appendChild(document.createTextNode(templates[index]["name"]))
                templateLink.id = index
                templateLink.classList.add("template")
                templateLink.onclick = openTemplate
                if (favorites.includes(parseInt(index))) {
                    document.getElementById("favorites").appendChild(templateLink)
                } else {
                    document.getElementById("non-favorites").appendChild(templateLink)
                }
            }
        }
    }
    req.open("GET", "templates.json", true)
    req.send()
}

document.addEventListener('click', function(event) { // this is so we can tell when someone clicks outside of the template finder while the dropdown is expanded https://stackoverflow.com/questions/14188654/detect-click-outside-element-vanilla-javascript/28432139
    if (dropdown) {
        if (!document.getElementById("template-finder").contains(event.target)) {
            collapseDropdown()
        }
    }
})

updateSearch = function () {
    for (template of document.getElementsByClassName("template")) {
        if (template.innerText.toLowerCase().includes(document.getElementById("search").value.toLowerCase())) { // note to future self: this will re-show elements when they match in case the user types a query and then backspaces, creating new matches
            template.style.display = "block"
        } else {
            template.style.display = "none"
        }
    }
}

copy = function () {
    document.getElementById("output").select()
    document.execCommand("copy")
    document.getElementById("copy").innerText = "Copied!"
    setTimeout(function () {
        document.getElementById("copy").innerText = "Copy!" 
    }, 3000)
}

toggleFavorite = function (node) {
    node = node.target
    if (node.parentNode.parentNode.id == "favorites") {
        node.src = "stars/star1.svg"
        document.getElementById("non-favorites").appendChild(node.parentNode)
        for (x in favorites) { // there should be an easier way to do this in javascript
            if (favorites[x] == node.parentNode.id) {
                favorites.splice(x, 1)
            }
        }
        localStorage.favorites = favorites
    } else {
        node.src = "stars/star2.svg"
        document.getElementById("favorites").appendChild(node.parentNode)
        favorites.push(parseInt(node.parentNode.id))
        localStorage.favorites = favorites
    }
}
