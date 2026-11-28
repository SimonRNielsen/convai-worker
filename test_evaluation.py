
import requests
import json

# Cloudflare Worker endpoint
url = "https://convai-auth.simonrn.workers.dev/evaluate"

# Request body
payload = {
    "session_id": "f447ec67-86d5-4c34-baee-471c84d5fab3",
    "character_id": "d9f6777c-8e0e-4d28-9518-e7569be85ea0",
    "evaluation_profile_id": "kitwood-v1"
}

# Headers
headers = {
    "Content-Type": "application/json"
}

try:
    print("Sending evaluation request...")

    response = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=120
    )

    print(f"\nHTTP Status: {response.status_code}")

    # Print response
    try:
        result = response.json()
        print("\nResponse:")
        print(json.dumps(result, indent=4, ensure_ascii=False))
    except ValueError:
        print("\nResponse was not valid JSON:")
        print(response.text)

except requests.exceptions.Timeout:
    print("Request timed out.")

except requests.exceptions.RequestException as error:
    print(f"Request failed: {error}")
