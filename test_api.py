import urllib.request
import json
import base64

# 1 pixel transparent gif base64
img_b64 = "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
data = json.dumps({"image": "data:image/gif;base64," + img_b64}).encode('utf-8')

req = urllib.request.Request(
    'http://localhost:5000/api/camera-recognize',
    data=data,
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code)
    print(e.read().decode())
except Exception as e:
    print("Error:", e)
