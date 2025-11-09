from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse
import httpx
import os
import urllib.parse
import logging

api_router = APIRouter()

GOOGLE_REDIRECT_URI = "http://localhost:8000/auth/oauth2callback"

@api_router.get("/google")
async def auth_google():
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "response_type": "code",
        "scope": "openid email profile https://www.googleapis.com/auth/fitness.activity.read",
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "access_type": "offline",
        "prompt": "consent",
    }

    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    logging.info(f"Redirecting to Google OAuth URL: {url}")
    return RedirectResponse(url)


@api_router.get("/oauth2callback", response_class=HTMLResponse)
async def oauth2callback(request: Request):
    code = request.query_params.get("code")
    if not code:
        return HTMLResponse("Missing authorization code", status_code=400)

    token_endpoint = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                token_endpoint,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            resp.raise_for_status()
            token_data = resp.json()
            logging.info(f"Google token response: {token_data}")

        except httpx.HTTPError as e:
            logging.error(f"Token exchange failed: {e}")
            return HTMLResponse(f"Token exchange failed: {str(e)}", status_code=500)

    # TODO: Save token_data in DB with logged in user ID
    
    # Redirect to your frontend success screen
    return RedirectResponse("http://localhost:3000/google-success")
