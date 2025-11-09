import httpx

# Example JSON body templates for aggregation - replace with your actual request body structures as per Google Fit API docs
STEPS_AGGREGATE_BODY = {
  "aggregateBy": [{
    "dataTypeName": "com.google.step_count.delta",
    "dataSourceId": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
  }],
  "bucketByTime": {"durationMillis": 86400000},
  "startTimeMillis": 1762560000000,      # Put your desired start time in millis (e.g. 7 days ago)
  "endTimeMillis": 1762646399999         # Put your desired end time in millis (current time)
}

HEART_RATE_AGGREGATE_BODY = {
  "aggregateBy": [{
    "dataTypeName": "com.google.heart_rate.bpm"
  }],
  "bucketByTime": {"durationMillis": 86400000},
  "startTimeMillis": 1762560000000,
  "endTimeMillis": 1762646399999
}

SLEEP_AGGREGATE_BODY = {
  "aggregateBy": [{
    "dataTypeName": "com.google.sleep.segment"
  }],
  "startTimeMillis": 1762560000000,
  "endTimeMillis": 1762646399999
}

OXYGEN_AGGREGATE_BODY = {
  "aggregateBy": [{
    "dataTypeName": "com.google.oxygen_saturation"
  }],
  "bucketByTime": {"durationMillis": 86400000},
  "startTimeMillis": 1762560000000,
  "endTimeMillis": 1762646399999
}

async def fetch_steps(access_token: str):
    url = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate"
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=STEPS_AGGREGATE_BODY, headers=headers)
        response.raise_for_status()
        return response.json()

async def fetch_heart_rate(access_token: str):
    url = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate"
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=HEART_RATE_AGGREGATE_BODY, headers=headers)
        response.raise_for_status()
        return response.json()

async def fetch_sleep(access_token: str):
    url = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate"
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=SLEEP_AGGREGATE_BODY, headers=headers)
        response.raise_for_status()
        return response.json()

async def fetch_oxygen(access_token: str):
    url = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate"
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=OXYGEN_AGGREGATE_BODY, headers=headers)
        response.raise_for_status()
        return response.json()

