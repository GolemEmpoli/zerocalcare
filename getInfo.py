#!/usr/bin/python3
import mysql.connector as sql
import datetime as dt
import sys
import re
import glob

def parseOptions(arr):
  if len(arr) == 1:
    return {'RAW':arr}
  else:
    options = {}
    for i in arr:
      k = i.split('=')
      if len(k) == 1:
        options['RAW'] = k[0]
      else:
        options[k[0]] = k[1]
    return options

def getEvents(baseDay, interval):
  if interval == 'week':
    rightLimit = (baseDay+dt.timedelta(weeks=1)).strftime('%s')
  elif interval == '4weeks':
    rightLimit = (baseDay+dt.timedelta(weeks=4)).strftime('%s')
  else:
    raise ValueError('Invalid argument passed to getEvents')
  leftLimit = baseDay.strftime('%s')

  c = sql.connect(unix_socket=glob.cfg['mysql']['unix_socket'], host=glob.cfg['mysql']['host'], user=glob.cfg['mysql']['user'], password=glob.cfg['mysql']['password'], db=glob.cfg['mysql']['db'])
  mycursor = c.cursor()
  # For repeated events (not yet supported)
  #sql = "SELECT obj.calendardata FROM oc_calendarobjects AS obj INNER JOIN oc_calendars AS cal ON obj.calendarid = cal.id WHERE cal.displayname='prova'AND obj.firstoccurence < %s AND obj.lastoccurence > %s" % (leftLimit, rightLimit)
  query = "SELECT obj.calendardata FROM oc_calendarobjects AS obj INNER JOIN oc_calendars AS cal ON obj.calendarid = cal.id WHERE cal.displayname='%s' AND obj.firstoccurence < %s AND obj.firstoccurence > %s" % (glob.cfg['caldav']['cal_name'], rightLimit, leftLimit)
  mycursor.execute(query)
  result = mycursor.fetchall()
  c.close()

  events = []

  for event in result:
    #print (event)
    event = event[0].decode('utf8') # i selected only first column
    #print (event)
    blockParsing = None

    event_dict = {}

    for item in event.split('\r\n'):
      try:
        k,v = item.split(':',1)
      except:
        continue
      k = k.split(';')
      v = re.split('(?<!\\\\);',v)
      k += v

      # Does not work well with nested blocks
      # but nobody cares
      if k[0] == "BEGIN":
        blockParsing = k[1]
      elif k[0] == "END":
        blockParsing = None
      else:
        if blockParsing == "VEVENT":
          if k[0] == 'SUMMARY':
            # save event name
            event_dict['NAME'] = k[1]
            #print("Event Name: %s" % event_dict['NAME'])
          elif k[0] == 'DTSTART':
            # check if len(k) > 2
            # if yes, date has a not-datetime format
            # (i.e. only date for all-day events).
            options = parseOptions(k[1:])
            #print("Options %s" % options)
            if 'VALUE' in options and options['VALUE'] == 'DATE':
              event_dict['DATETIME']  = dt.datetime.strptime(options['RAW'],'%Y%m%d')
              event_dict['ALLDAY'] = True
            else:
              event_dict['DATETIME'] = dt.datetime.strptime(options['RAW'],'%Y%m%dT%H%M%S')
              event_dict['ALLDAY'] = False
            #print("StartDate: %s" % event_dict['DATETIME'])
          elif k[0] == 'RRULE':
            continue

    events += [event_dict]

  # Thanks stackoverflow
  # Return events sorted by date, AllDay first
  return sorted(events, key=lambda k: "%s %d" % (k['DATETIME'],k['ALLDAY'] == 0))

# Check if this file is executed as main file or included
######## SHOW DATA #######
if __name__ == '__main__':
    print("ZERo Optimized CALdav CAlendar Reader Engine")
    print("--------------------------------------------")

    events = getEvents(dt.datetime.today(),'week')

    for event in events:
        try:
          print ("Event Name: %s" % event['NAME'])
          print ("Event Date: %s" % event['DATETIME'].date())
          if event['ALLDAY']:
              print("All Day")
          else:
              print ("Event Time: %s" % event['DATETIME'].time())
        except :
          print("Malformed event")
        print("----------------")
