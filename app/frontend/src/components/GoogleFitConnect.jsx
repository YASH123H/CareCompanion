import React from 'react';

const clientId = "681980167875-2dgp0ks41hqsv4l38iekai85bo56r52k.apps.googleusercontent.com";
const redirectUri = "http://localhost:3000/oauth2callback";
const scope = encodeURIComponent("https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read");

function GoogleFitConnect() {
  const startOAuth = () => {
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    window.location.href = oauthUrl;
  };

  return <button onClick={startOAuth}>Connect Google Fit</button>;
}

export default GoogleFitConnect;
