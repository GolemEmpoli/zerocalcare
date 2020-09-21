"use strict"

function zerocalcareDisplay(xhr) {
    let zerocalcareOutput = document.getElementById('zerocalcareOutput');
    
    if (xhr.readyState == 4 && xhr.status == 200) {

        let json_obj = JSON.parse(xhr.responseText);
        let atLeastOne = false; 

        for (let i in json_obj) {
            // Do not display private events
            if (typeof json_obj[i]['CLASS'] === 'string' && json_obj[i]['CLASS'] == 'PRIVATE') {
                continue;
            }

            // Future improvements needed for a better backend output date in ISO format
            // Now we have to parse the string :( very very ugly
            let date = new Date(json_obj[i]['DATETIME']);

            let m = new moment(date);
            m.locale('it');

            let eventElement = document.createElement('div');

            let titleElement = document.createElement('h5');
            titleElement.appendChild(document.createTextNode(decodeURI(json_obj[i]['SUMMARY'])));
            titleElement.style.fontStyle = 'italic';
            titleElement.classList.add('widget-title');
            eventElement.appendChild(titleElement);

            let contentEventElement = document.createElement('div');
            eventElement.appendChild(contentEventElement);

            // Check if event is not confirmed
            if (typeof json_obj[i]['STATUS'] === 'string') {
                if (json_obj[i]['STATUS'] == 'TENTATIVE') {
                    // Make the text a bit lighter and italic
                    contentEventElement.style.fontStyle = 'italic';
                    contentEventElement.style.color = 'gray';
                    // Add note
                    let unconfirmedElement = document.createElement('div');
                    unconfirmedElement.style.fontWeight = 'bold';
                    unconfirmedElement.appendChild(document.createTextNode('⚠️ Non confermato!'));
                    contentEventElement.appendChild(unconfirmedElement);
                }
                else if (json_obj[i]['STATUS'] == 'CANCELLED') {
                    // Strike time, date and location to remark this concept
                    dateText.style.textDecoration = 'line-through';
                    timeText.style.textDecoration = 'line-through';
                    locationText.style.textDecoration = 'line-through';
                    // Add note
                    let unconfirmedElement = document.createElement('div');
                    unconfirmedElement.style.fontWeight = 'bold';
                    unconfirmedElement.appendChild(document.createTextNode('⚠️ Cancellato!'));
                    contentEventElement.appendChild(unconfirmedElement);
                }
            }

            let dateElement = document.createElement('div');
            let dateText = document.createElement('span');
            dateText.appendChild(document.createTextNode(m.format('dddd D MMMM YYYY')));
            dateElement.appendChild(document.createTextNode('📅  '));
            dateElement.appendChild(dateText);
            contentEventElement.appendChild(dateElement);

            let timeElement = document.createElement('div');
            let timeText = document.createElement('span');
            let timeString = (json_obj[i]['ALLDAY'] == true) ? 'Tutto il giorno' : ('ore ' + m.format('HH:mm'));
            timeText.appendChild(document.createTextNode(timeString));
            timeElement.appendChild(document.createTextNode('⏰ '));
            timeElement.appendChild(timeText);
            contentEventElement.appendChild(timeElement);

            // add if location is not empty -- default location should be selected by backend
            let locationElement = document.createElement('div');
            let locationText = document.createElement('span');
            if (json_obj[i]['LOCATION'] !== undefined && json_obj[i]['LOCATION'] != '') {
                locationText.appendChild(document.createTextNode(decodeURI(json_obj[i]['LOCATION'])));
            }
            else {
                locationText.appendChild(document.createTextNode('Officina Informatica'));
            }
            locationElement.appendChild(document.createTextNode('📍  '));
            locationElement.appendChild(locationText);
            contentEventElement.appendChild(locationElement);

            if (json_obj[i]['DESCRIPTION'] !== undefined && json_obj[i]['DESCRIPTION'] != '') {
                let descriptionElement = document.createElement('div');
                let descriptionText = document.createElement('span');
                descriptionText.appendChild(document.createTextNode(decodeURI(json_obj[i]['DESCRIPTION'])));
                descriptionElement.appendChild(document.createTextNode('📝  '));
                descriptionElement.appendChild(descriptionText);
                descriptionElement.style.display = "none";

                // Display a clickable "..." button.
                let moreElement = document.createElement('div');
                let moreShowText = document.createElement('a');
                let moreHideText = document.createElement('a');
                
                moreShowText.appendChild(document.createTextNode('⬇️ Più informazioni...'));
                moreElement.appendChild(moreShowText);
                moreHideText.appendChild(document.createTextNode('⬆️ Nascondi informazioni...'));
                moreHideText.style.display = "none";
                moreElement.appendChild(moreHideText);

                moreElement.onclick = () => {
                    if (descriptionElement.style.display == "none") {
                        descriptionElement.style.display  =
                        moreHideText.style.display = "block";
                        moreShowText.style.display = "none";
                    } else {
                        descriptionElement.style.display  =
                        moreHideText.style.display = "none";
                        moreShowText.style.display = "block";
                    }
                };
                contentEventElement.appendChild(moreElement);
                contentEventElement.appendChild(descriptionElement);
            }
                    
            zerocalcareOutput.appendChild(eventElement);
            atLeastOne = true;
        }

        if (atLeastOne == false) {
            zerocalcareOutput.childNodes[0].textContent = 'Nessun appuntamento in programma';
        }
    }
    else {
        zerocalcareOutput.childNodes[0].textContent = 'API Error: Calendario non disponibile';
    }
}

function zerocalcareTrigger(url) {
    if (typeof url !== "string")
        return

    let xhr = new XMLHttpRequest();
    xhr.onload = () => { zerocalcareDisplay(xhr) };
    xhr.open('GET', url, true);
    xhr.send(null);
}