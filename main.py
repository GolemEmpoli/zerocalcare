#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
import xml.etree.ElementTree as ET
import sys
import cgitb, cgi
import datetime as dt
import locale

from getInfo import *

locale.setlocale(locale.LC_TIME, 'it_IT')

# Start CGI handling for webserver
cgitb.enable()
inputvars = cgi.FieldStorage()

print('Content-Type: text/html; charset=utf-8')
print()

### End of HTTP headers:  it is now safe to output things
##########################################################


tree = ET.ElementTree()
main = ET.Element('main')

tree._setroot(main)

# get BaseDate and interval
interval = 'week' if 'interval' not in inputvars else inputvars['interval'].value
basedate = dt.date.today() if 'basedate' not in inputvars else dt.datetime.strptime(inputvars['basedate'].value, '%Y-%m-%d')

for event in getEvents(basedate, interval):
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