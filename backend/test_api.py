import requests

URL = "http://127.0.0.1:5000/api/news"

def test_news_endpoint():
    print(f"Testing endpoint: {URL}")
    try:
        response = requests.get(URL)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Success! Response data:")
            print(response.json())
        else:
            print(f"Failed! Response: {response.text}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_news_endpoint()
