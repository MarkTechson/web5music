const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const ACCESS_TOKEN_URL = 'https://accounts.spotify.com/api/token';

app.use(express.static(path.join(__dirname, 'web')));

let spotifyToken;

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
        console.log('➡️ spotify token acquired');
    });
}

async function searchSpotify(artist, track) {
    const baseURL = `https://api.spotify.com/v1/search?`;
    const santizedParams = new URLSearchParams(`q=artist:${artist} track:${track}&type=track`);
    const url = baseURL + santizedParams.toString();

    /**
     * Request the data from Spotify
     */
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${spotifyToken}`
        }
    });

    const data = await response.json();
    const tracks = data.tracks.items.filter(aTrack => aTrack.name.toLowerCase() === track.toLowerCase());

    if (tracks.length > 0) {
        console.log('✅ found a matching track');
    } else {
        return {
            album: {
                images: [
                    'path/to/default/photo'
                ]
            }
        };
    }

    return tracks[0];
}


app.get('/music-info', async (req, res) => {
    if (!spotifyToken) {
        /**
         * If the token has not be set (i.e., requested), make a call to request
         * the token.
         *  
         * TODO: nice to have, set a timer for 3600 seconds because the life
         * of the token is only 3600 seconds and would need to be refeshed
         */
        await fetchAccessToken();
    }

    const {artist, track} = req.query;
    const trackData = await searchSpotify(artist, track);

    res.json(trackData);
});

app.listen(port, () => {
    console.log('🌍 Server listening');
})

