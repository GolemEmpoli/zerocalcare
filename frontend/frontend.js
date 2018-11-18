function Get(yourUrl){
      var Httpreq = new XMLHttpRequest();
      Httpreq.open("GET",yourUrl,false);
      Httpreq.send(null);
      return Httpreq.responseText;
}

var json_obj = JSON.parse(Get("https://golem.linux.it/cgi/zerocalcare/main.py?interval=4weeks"));
console.log("this is the JSON: "+JSON.stringify(json_obj));
fmt_date = { weekday: 'short', month: 'long', day: 'numeric' };
fmt_time = { hour: 'numeric', minute: 'numeric'};
for (i in json_obj) {
  var time_str;
  var date = new Date(json_obj[i]["DATETIME"])
  console.log(JSON.stringify(json_obj[i]));
  document.write('<h5 class="widget-title" style="font-style: italic; color: #009000;">'+json_obj[i]["NAME"]+'</h5>');
  document.write("<div>📅 "+date.toLocaleDateString("it-IT", fmt_date)+"</div>");
  if (json_obj[i]["ALLDAY"] == true)
    time_str = "Tutto il giorno"
  else
    time_str =  date.toLocaleString("it-IT", fmt_time)
  document.write("<div>⏰ "+time_str+"</div>");
}
