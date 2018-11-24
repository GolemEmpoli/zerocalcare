#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
import xml.etree.ElementTree as ET
import sys
import cgitb, cgi
import datetime as dt
import locale
import json

from getInfo import *

locale.setlocale(locale.LC_TIME, 'it_IT')

# Start CGI handling for webserver
cgitb.enable()
inputvars = cgi.FieldStorage()

# Default format is json, keep HTML for light debug
if 'format' in inputvars and inputvars['format'].value == 'html':
    format = 'html'
    print('Content-Type: text/html; charset=utf-8')
else:
    format = 'json'
    print('Content-Type: text/json; charset=utf-8')

print()
### End of HTTP headers:  it is now safe to output things
##########################################################

# get BaseDate and interval
interval = 'week' if 'interval' not in inputvars else inputvars['interval'].value
basedate = dt.datetime.today() if 'basedate' not in inputvars else dt.datetime.strptime(inputvars['basedate'].value, '%Y-%m-%d')

# Make request to grep all events in interval
events = getEvents(basedate, interval)

if format == 'html':
    tree = ET.ElementTree()
    main = ET.Element('main')
    tree._setroot(main)

    for event in events:
        name = event['NAME']

        article = ET.Element('article')
        h1 = ET.Element('h1')
        span = ET.Element('span')

        h1.text = name
        span.text = event['DATETIME'].strftime('%-d %B %Y')
        if not (event['ALLDAY']):
            span.text += ' alle ' + event['DATETIME'].strftime('%-I:%-M')

        article.append(h1)
        article.append(span)

        main.append(article)

    htmlString = ET.tostring(tree.getroot(), encoding='unicode', method='html')
    print(htmlString)
else:
    # stringify dates to be JSON-serialized
    for event in events:
        event['DATETIME'] = str(event['DATETIME'])
    print(json.dumps(events, indent=4))