// Require moment.js (with locales)
function Get(yourUrl){
      var Httpreq = new XMLHttpRequest();
      Httpreq.open("GET",yourUrl,false);
      Httpreq.send(null);
      return Httpreq.responseText;
}

var json_obj = JSON.parse(Get("https://golem.linux.it/cgi/zerocalcare/main.py?interval=4weeks"));
console.log("this is the JSON: "+JSON.stringify(json_obj));

moment.locale('it');
for (i in json_obj) {
  var time_str;
  var date = moment(json_obj[i]["DATETIME"])
  console.log(JSON.stringify(json_obj[i]));
  document.write('<h5 class="widget-title" style="font-style: italic; color: #009000;">'+json_obj[i]["NAME"]+'</h5>');
  document.write("<div>📅 "+date.format("ddd D MMMM")+"</div>");

  if (json_obj[i]["ALLDAY"] == true)
    time_str = "Tutto il giorno"
  else
    time_str = date.format("H:mm")
  document.write("<div>⏰ "+time_str+"</div>");

  // Probably is better to get a default location from Python?
  if ("LOCATION" in json_obj[i] && json_obj[i]["LOCATION"] != '' )
    document.write("<div>📍 "+json_obj[i]["LOCATION"]+"</div>");
  else
    document.write("<div>📍 Officina Informatica</div>");

}
