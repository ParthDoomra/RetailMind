import urllib.request
import urllib.parse
import json
import base64

def test_api():
    # Load mouse image
    url = "https://m.media-amazon.com/images/I/61UxfXTUyvL._AC_SL1500_.jpg"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        img_bytes = response.read()

    b64_str = base64.b64encode(img_bytes).decode('utf-8')
    data = {"image": "data:image/jpeg;base64," + b64_str}
    
    # Send POST request
    api_url = "http://localhost:5000/api/camera-recognize"
    req2 = urllib.request.Request(api_url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req2) as response:
            res_data = response.read()
            print("Response:", json.loads(res_data))
    except urllib.error.URLError as e:
        print("API error:", e.reason)
    except Exception as e:
        print("Error:", str(e))

if __name__ == "__main__":
    test_api()
