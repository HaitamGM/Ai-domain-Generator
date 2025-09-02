import os

# Gunicorn configuration file

# Worker processes
workers = int(os.environ.get('GUNICORN_PROCESSES', '2'))
worker_class = os.environ.get('GUNICORN_WORKER_CLASS', 'sync')

# Networking
bind = os.environ.get('GUNICORN_BIND', '0.0.0.0:5000')

# Logging
accesslog = '-'
errorlog = '-'

# Timeouts
timeout = int(os.environ.get('GUNICORN_TIMEOUT', '120'))
keepalive = int(os.environ.get('GUNICORN_KEEPALIVE', '5'))
