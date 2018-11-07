import configparser

# Read configuration files (latest files in list override previous settings)
cfg = configparser.ConfigParser()
cfg.read(['conf/conf.ini', 'conf/conf.custom.ini'])