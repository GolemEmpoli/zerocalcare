"use strict";
function zerocalcareDisplay() {
    const zerocalcareOutput = document.getElementById('zerocalcareOutput');

    if (this.readyState == 4 && this.status == 200) {

        var json_obj = JSON.parse(this.responseText);

        if (json_obj.length == 0) {
            zerocalcareOutput.childNodes[0].textContent = 'Nessun appuntamento in programma';
            return
        }

        var eventsContainer = {
            Eventi : null,
            Corsi : null
        };

        for (var c in eventsContainer) {
            eventsContainer[c] = document.createElement('div');
            var titleElement = document.createElement('h4');
            titleElement.appendChild(document.createTextNode(c));
            titleElement.style.fontStyle = 'italic';
            titleElement.classList.add('widget-title');
            eventsContainer[c].appendChild(titleElement);
            zerocalcareOutput.appendChild(eventsContainer[c]);
        }

        for (var i in json_obj) {
            // Do not display private events
            if (typeof json_obj[i]['CLASS'] === 'string' && json_obj[i]['CLASS'] == 'PRIVATE') {
                continue;
            }

            // Future improvements needed for a better backend output date in ISO format
            // Now we have to parse the string :( very very ugly
            var date = new Date(json_obj[i]['DATETIME']);

            var m = new moment(date);
            m.locale('it');

            var eventElement = document.createElement('div');

            var titleElement = document.createElement('h5');
            titleElement.appendChild(document.createTextNode(json_obj[i]['NAME']));
            titleElement.style.fontStyle = 'italic';
            titleElement.classList.add('widget-title');

            var dateElement = document.createElement('div');
            var dateText = document.createElement('span');
            dateText.appendChild(document.createTextNode(m.format('dddd D MMMM YYYY')));
            dateElement.appendChild(document.createTextNode('📅  '));
            dateElement.appendChild(dateText);

            var timeElement = document.createElement('div');
            var timeText = document.createElement('span');
            var timeString = (json_obj[i]['ALLDAY'] == true) ? 'Tutto il giorno' : ('ore ' + m.format('HH:mm'));
            timeText.appendChild(document.createTextNode(timeString));
            timeElement.appendChild(document.createTextNode('⏰ '));
            timeElement.appendChild(timeText);
            

            // add if location is not empty -- default location should be selected by backend
            var locationElement = document.createElement('div');
            var locationText = document.createElement('span');
            if (typeof json_obj[i]['LOCATION'] !== 'undefined' && json_obj[i]['LOCATION'] != '') {
                locationText.appendChild(document.createTextNode(json_obj[i]['LOCATION']));
            }
            else {
                locationText.appendChild(document.createTextNode('Officina Informatica'));
            }
            locationElement.appendChild(document.createTextNode('📍  '));
            locationElement.appendChild(locationText);
            
            eventElement.appendChild(titleElement);
            // Check if event is not confirmed
            if (typeof json_obj[i]['STATUS'] === 'string') {
                // Strike time, date and location to remark this concept
                var strikeEvent = function (message) {
                    dateText.style.textDecoration = 'line-through';
                    timeText.style.textDecoration = 'line-through';
                    locationText.style.textDecoration = 'line-through';
                    var unconfirmedElement = document.createElement('div');
                    unconfirmedElement.style.fontWeight = 'bold';
                    unconfirmedElement.appendChild(document.createTextNode(message));
                    eventElement.appendChild(unconfirmedElement);
                }
                
                if (json_obj[i]['STATUS'] == 'TENTATIVE') {
                    strikeEvent('⚠️ Non confermato!');
                }
                else if (json_obj[i]['STATUS'] == 'CANCELLED') {
                    strikeEvent('⚠️ Cancellato!');
                }
            }
            eventElement.appendChild(dateElement);
            eventElement.appendChild(timeElement);
            eventElement.appendChild(locationElement);
            
            if (typeof json_obj[i]['CATEGORIES'] === 'object') {
                if (json_obj[i]['CATEGORIES'].includes('Corsi')) {
                    eventsContainer['Corsi'].appendChild(eventElement);
                }
                else {
                    eventsContainer['Eventi'].appendChild(eventElement);
                }
            }
            else {
                eventsContainer['Eventi'].appendChild(eventElement);
            }
        }
    }
    else {
        zerocalcareOutput.childNodes[0].textContent = 'API Error: Calendario non disponibile';
    }
}

function zerocalcareTrigger() {
    const xhr = new XMLHttpRequest();
    xhr.onload = zerocalcareDisplay;
    xhr.open('GET', 'https://golem.linux.it/cgi/zerocalcare/main.py?interval=4weeks', true);
    xhr.send(null);
}
