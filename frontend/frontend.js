function zerocalcareDisplay() {

    zerocalcareOutput = document.getElementById('zerocalcareOutput');

    if (xhr.readyState == 4 && xhr.status == 200) {

        var json_obj = JSON.parse(xhr.responseText);

        for (i in json_obj) {
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
            dateElement.appendChild(document.createTextNode('📅  ' + m.format('dddd D MMMM YYYY') ));

            var timeElement = document.createElement('div');
            var timeString = (json_obj[i]['ALLDAY'] == true) ? 'Tutto il giorno' : ('ore ' + m.format('HH:mm'));
            timeElement.appendChild(document.createTextNode('⏰ ' + timeString));

            // add if location is not empty -- default location should be selected by backend
            var locationElement = document.createElement('div');
            if (typeof json_obj[i]['LOCATION'] !== 'undefined' && json_obj[i]['LOCATION'] != '') {
                var locationString = json_obj[i]['LOCATION'];
            }
            else {
                var locationString = 'Officina Informatica';
            }
            locationElement.appendChild(document.createTextNode('📍  ' + locationString));

            eventElement.appendChild(titleElement);
            eventElement.appendChild(dateElement);
            eventElement.appendChild(timeElement);
            eventElement.appendChild(locationElement);
            zerocalcareOutput.appendChild(eventElement);
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
