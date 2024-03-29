#!/usr/bin/env python3

import datetime as dt
import dateutil.relativedelta as rd
import sys
import re
import glob
import pytz
import caldav

# Parameter: a TEXT string
# Returns: the escaped string, according to RFC 5545 §3.3.11
def escape(string):
  string = re.sub(r"\\n", "\n", string)
  string = re.sub(r"\\(.)", r"\1", string)
  return string

# Parameter: list of options in format key=value
# Returns: dictionary of given options in format
#         {key : value, ...}
def parseOptions(arr):
  options = {}
  for i in arr:
    k = i.split('=')
    if len(k) == 1:
      options['RAW'] = k[0]
    else:
      options[k[0]] = k[1]
  return options

# Parameter: datetime object, interval string in {'today', 'week', '4weeks'}
# Returns: dictionary of events starting from baseDay, inside interval.
#            Keys have direct correspondance with iCalendar property names.
#            Some custom ones have been added (i.e. ALLDAY).
#         {'SUMMARY'    : occurrence name,
#          'DATETIME'   : date in format YYYY-MM-DD hh:mm:ss+tz_offset,
#          'DESCRIPTION': a longer occurence text,
#          'LOCATION'   : self explanatory,
#          
#          'ALLDAY'     : boolean, true if event lasts all day. Hour in DATETIME has no meaning,
#          'OCCURRENCE' : [optional] number of occurrence in repeated events}
def getEvents(baseDay, interval):
  if   interval == 'today':
    rightLimit = (baseDay+dt.timedelta(days=1))
  elif interval == 'week':
    rightLimit = (baseDay+dt.timedelta(weeks=1))
  elif interval == '4weeks':
    rightLimit = (baseDay+dt.timedelta(weeks=4))
  else:
    raise ValueError('Invalid argument passed to getEvents')
  leftLimit = baseDay

  local_tz = pytz.timezone(glob.cfg['caldav']['local_tz'])
  leftLimit = local_tz.localize(leftLimit)
  rightLimit = local_tz.localize(rightLimit)

  url = glob.cfg['caldav']['cal_url']

  client = caldav.DAVClient(url=url)
  calendar = caldav.Calendar(client=client, url=url)

  result = calendar.date_search(
          start=leftLimit,
          end=rightLimit)

  events = []

  for event in result:    
    repetition = {'single' : True, 'freq' : {'DAILY': 0, 'WEEKLY' : 0, 'MONTHLY' : 0, 'YEARLY': 0}, 'interval' : 1, 'count': 0, 'until' : None}

    # fetch ascii data
    event = event.data
    # Current BEGIN:xxx block name
    blockParsing = None
    # Current property name (for long content line unfolding, RFC §3.1)
    propertyName = None

    event_dict = {}

    for item in event.split('\n'):
      # ignore empty lines
      if len(item) == 0:
        continue

      # Check if this line is part of a long content lines (RFC §3.1)
      # i.e. begins with SPACE or HTAB.
      if item[0] == ' ' or item[0] == '\t':
        item = escape(item)
        try:
          event_dict[propertyName] += item.lstrip()
        except KeyError:
          # Malformed line or, more probably, programmer's error
          pass
        continue

      # else... check out for property's name
      try:
        k,v = item.split(':',1)
      except:
        continue
      k = k.split(';')
      v = re.split('(?<!\\\\);',v)
      k += v

      propertyName = k[0]

      # Does not work well with nested blocks
      # but nobody cares
      if k[0] == "BEGIN":
        blockParsing = k[1]
        if blockParsing == "VEVENT":
          event_dict = {}
      elif k[0] == "END":
        if k[1] == "VEVENT":
          # If single event push into list
          if repetition['single'] == True:
            events += [event_dict]
          else:
            event_count = 1
            # Get first event inside interval
            while event_dict['DATETIME'] < leftLimit:
              event_dict['DATETIME'] += rd.relativedelta(days=repetition['freq']['DAILY'],weeks=repetition['freq']['WEEKLY'],months=repetition['freq']['MONTHLY'],years=repetition['freq']['YEARLY'])*repetition['interval']
              event_count += 1

            # Push all events inside interval
            while event_dict['DATETIME'] < rightLimit and (repetition['until'] is None or repetition['until'] >= event_dict['DATETIME'].date()):
              event_dict['OCCURRENCE'] = event_count
              events += [event_dict.copy()]
              if repetition['count'] == event_count:
                break
              event_count+=1
              event_dict['DATETIME'] += rd.relativedelta(days=repetition['freq']['DAILY'],weeks=repetition['freq']['WEEKLY'],months=repetition['freq']['MONTHLY'],years=repetition['freq']['YEARLY'])*repetition['interval']
        blockParsing = None
      else:
        if blockParsing == "VEVENT":
          if k[0] == 'SUMMARY':
            # save event name
            event_dict['SUMMARY'] = escape(k[1])
          elif k[0] == 'DTSTART':
            options = parseOptions(k[1:])

            if 'TZID' in options:
              event_tz = pytz.timezone(options['TZID'])
              event_fmt = "%Y%m%dT%H%M%S"
            # If TZID flag is not specified, datetime is UTC
            else:
              event_tz = pytz.timezone('UTC')
              event_fmt = "%Y%m%dT%H%M%SZ"

            # Check if time is set and then localize it
            if 'VALUE' in options and options['VALUE'] == 'DATE':
              event_parsed_dt = dt.datetime.strptime(options['RAW'],'%Y%m%d')
              event_dict['DATETIME'] = local_tz.localize(event_parsed_dt)
              event_dict['ALLDAY'] = True
            else:
              event_parsed_dt = dt.datetime.strptime(options['RAW'], event_fmt)
              event_parsed_dt = event_tz.localize(event_parsed_dt)
              event_dict['DATETIME'] = event_parsed_dt.astimezone(local_tz)
              event_dict['ALLDAY'] = False
          elif k[0] == 'LOCATION':
              event_dict['LOCATION'] = escape(k[1])
          elif k[0] == 'DESCRIPTION':
              event_dict['DESCRIPTION'] = escape(k[1])
          elif k[0] == 'RRULE':
            options = parseOptions(k[1:])
            repetition['single'] = False
            repetition['freq'][options['FREQ']] = 1

            if 'INTERVAL' in options:
              repetition['interval'] = int(options['INTERVAL'])

            if 'COUNT' in options:
              repetition['count'] = int(options['COUNT'])

            if 'UNTIL' in options:
                try:
                  fmt = "%Y%m%dT%H%M%S"
                  repetition['until'] = dt.datetime.strptime(options['UNTIL'], fmt)
                  repetition['until'] = local_tz.localize(repetition['until'])
                  # Strip out time because is meaningless
                  repetition['until'] = repetition['until'].date()
                except:
                  repetition['until'] = None
          elif k[0] == 'CLASS':
            # Store a boolean flag. True if PRIVATE
            event_dict['CLASS'] = k[1]
          elif k[0] == 'STATUS':
            event_dict['STATUS'] = k[1]

  # Thanks stackoverflow
  # Return events sorted by date, AllDay first
  return sorted(events, key=lambda k: "%s %d" % (k['DATETIME'],k['ALLDAY'] == 0))

# Only for test purposes
if __name__ == '__main__':
  print("ZERo Optimized CALdav CAlendar Reader Engine")
  print("--------------------------------------------")


  baseDay = dt.datetime.today()
  interval = 'week'
  if len(sys.argv) == 3:
    baseDay += dt.timedelta(days=int(sys.argv[1]))
    interval = sys.argv[2]

  events = getEvents(baseDay, interval)

  for event in events:
      try:
        print ("Event Name: %s" % event['SUMMARY'])
        print ("Event Date: %s" % event['DATETIME'].date())
        if event['ALLDAY']:
            print("All Day")
        else:
            print ("Event Time: %s" % event['DATETIME'].time())
      except :
        print("Malformed event")
      print("----------------")
