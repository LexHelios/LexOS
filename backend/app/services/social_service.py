import requests
import os

def post_tweet(message):
    url = "https://api.twitter.com/2/tweets"
    headers = {"Authorization": f"Bearer {os.getenv('TWITTER_BEARER_TOKEN')}"}
    payload = {"text": message}
    return requests.post(url, json=payload, headers=headers) 