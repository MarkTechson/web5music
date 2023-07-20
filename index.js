const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const ACCESS_TOKEN_URL = 'https://accounts.spotify.com/api/token';

app.use(express.static(path.join(__dirname, 'web')));

let spotifyToken;

/**
 * Requests the access token from spotify
 * 
 * @returns a promise
 */
function fetchAccessToken() {
    return fetch(ACCESS_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=client_credentials&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`
    }).then(response => {
        return response.json();
    }).then(tokenResponse => {
        spotifyToken = tokenResponse.access_token;
        console.log('➡️ Spotify token acquired');
    });
}

/**
 * searches the spotify API for an artist and track combination. Tries
 * to match a track. But if one is not found, we still return a valid response
 * 
 * @param {string} artist 
 * @param {string} track 
 * @returns an object representing the matching track
 */
async function searchSpotify(artist, track) {
    const baseURL = `https://api.spotify.com/v1/search?`;
    const santizedParams = new URLSearchParams(`q=artist:${artist} track:${track}&type=track`);
    const url = baseURL + santizedParams.toString();

    /**
     * Request the data from Spotify
     */
    let response;
    try {
        response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${spotifyToken}`
            }
        });
    } catch (error) {
        console.log('an error occurred', error);
    }

    const data = await response.json();
    console.log(data);
    let tracks = [];

    if (data.tracks) {
        tracks = (data.tracks.items || []).filter(aTrack => aTrack.name.toLowerCase() === track.toLowerCase());
    }

    if (tracks.length > 0) {
        console.log('✅ found a matching track');
    } else {
        return {
            album: {
                images: ['']
            }
        };
    }

    return tracks[0];
}

/**
 * API Endpoint: /music-info
 * 
 * Refreshes the API token and then makes a call to the spotify API
 */
app.get('/music-info', async (req, res) => {

    /**
     * the token being used doesn't auto refresh and expires after an hour, so we will
     * request it every time but in a real world scenario we'd handle this gracefully
     * 
     * For example:
     * using a auth flow that refreshed https://developer.spotify.com/documentation/web-api/tutorials/code-flow
     * 
     * (but since this example doesn't have to request user access, we'll do this)
     */

    await fetchAccessToken();
    const { artist, track } = req.query;
    const trackData = await searchSpotify(artist, track);

    res.json(trackData);
});

app.listen(port, () => {
    console.log('🌍 Server listening');
})

