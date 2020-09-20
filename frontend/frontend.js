function zerocalcareDisplay() {

    zerocalcareOutput = document.getElementById('zerocalcareOutput');

    if (xhr.readyState == 4 && xhr.status == 200) {

        var json_obj = JSON.parse(xhr.responseText);
        var atLeastOne = false; 

        for (i in json_obj) {
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
            titleElement.appendChild(document.createTextNode(decodeURI(json_obj[i]['NAME'])));
            titleElement.style.fontStyle = 'italic';
            titleElement.classList.add('widget-title');
            eventElement.appendChild(titleElement);

            // Check if event is not confirmed
            if (typeof json_obj[i]['STATUS'] === 'string') {
                if (json_obj[i]['STATUS'] == 'TENTATIVE') {
                    // Make the text a bit lighter and italic
                    dateText.style.fontStyle =
                    timeText.style.fontStyle =
                    locationText.style.fontStyle = 'italic';
                    dateText.style.color =
                    timeText.style.color =
                    locationText.style.color = 'gray';
                    // Add note
                    var unconfirmedElement = document.createElement('div');
                    unconfirmedElement.style.fontWeight = 'bold';
                    unconfirmedElement.appendChild(document.createTextNode('⚠️ Non confermato!'));
                    eventElement.appendChild(unconfirmedElement);
                }
                else if (json_obj[i]['STATUS'] == 'CANCELLED') {
                    // Strike time, date and location to remark this concept
                    dateText.style.textDecoration = 'line-through';
                    timeText.style.textDecoration = 'line-through';
                    locationText.style.textDecoration = 'line-through';
                    // Add note
                    var unconfirmedElement = document.createElement('div');
                    unconfirmedElement.style.fontWeight = 'bold';
                    unconfirmedElement.appendChild(document.createTextNode('⚠️ Cancellato!'));
                    eventElement.appendChild(unconfirmedElement);
                }
            }

            var dateElement = document.createElement('div');
            var dateText = document.createElement('span');
            dateText.appendChild(document.createTextNode(m.format('dddd D MMMM YYYY')));
            dateElement.appendChild(document.createTextNode('📅  '));
            dateElement.appendChild(dateText);
            eventElement.appendChild(dateElement);

            var timeElement = document.createElement('div');
            var timeText = document.createElement('span');
            var timeString = (json_obj[i]['ALLDAY'] == true) ? 'Tutto il giorno' : ('ore ' + m.format('HH:mm'));
            timeText.appendChild(document.createTextNode(timeString));
            timeElement.appendChild(document.createTextNode('⏰ '));
            timeElement.appendChild(timeText);
            eventElement.appendChild(timeElement);

            // add if location is not empty -- default location should be selected by backend
            var locationElement = document.createElement('div');
            var locationText = document.createElement('span');
            if (json_obj[i]['LOCATION'] !== undefined && json_obj[i]['LOCATION'] != '') {
                locationText.appendChild(document.createTextNode(json_obj[i]['LOCATION']));
            }
            else {
                locationText.appendChild(document.createTextNode('Officina Informatica'));
            }
            locationElement.appendChild(document.createTextNode('📍  '));
            locationElement.appendChild(locationText);
            eventElement.appendChild(locationElement);

            if (json_obj[i]['DESCRIPTION'] !== undefined && json_obj[i]['DESCRIPTION'] != '') {
                var descriptionElement = document.createElement('div');
                var descriptionText = document.createElement('span');
                descriptionText.appendChild(document.createTextNode(json_obj[i]['DESCRIPTION']));
                descriptionElement.appendChild(document.createTextNode('📝  '));
                descriptionElement.appendChild(descriptionText);
                eventElement.appendChild(descriptionElement);
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

function zerocalcareTrigger() {
    xhr = new XMLHttpRequest();
    xhr.onload = zerocalcareDisplay;
    xhr.open('GET', 'https://golem.linux.it/cgi/zerocalcare/main.py?interval=4weeks', true);
    xhr.send(null);

}
