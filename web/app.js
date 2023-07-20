import { Web5 } from 'https://cdn.jsdelivr.net/npm/@tbd54566975/web5@0.7.11/dist/browser.mjs';

const MUSIC_GROUP_SCHEMA_URL = 'https://schema.org/MusicGroup';
let web5;
let did;
let spotifyToken;
const ACCESS_TOKEN_URL = 'https://accounts.spotify.com/api/token';

document.getElementById('saveBtn').onclick = createEntry;
window.onload = init;

async function init() {
  // get spotify access key
  const accessTokenResponse = await fetch(ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: ''
  });

  spotifyToken = (await accessTokenResponse.json()).access_token;

  return;
  /**
   * If the Web5 import failed for some reason, pass a warning to the
   * user and return.
   */
    if (!Web5) {
        console.log('⚠️ Unabled to load Web5');
        return;
    }
    console.log('✅ Web5 loaded successfully');

    /**
     * Using the connect method on the Web5 import to
     * create a web5 instance and get access to the existing DID
     * or create a new one.
     */
    const response = await Web5.connect();
    web5 = response.web5;
    did = response.did;

    /**
     * Query the DWN (decentralized web nodes) for existing data. Filter the
     * records returned by the schema type which is MusicRecording.
     */
    const { records } = await web5.dwn.records.query({
        from: did,
        message: {
            filter: {
              schema: MUSIC_GROUP_SCHEMA_URL
            }
        }
    });
  
    const recordJson = await records[0].data.json();
    console.log(recordJson);
    displaySavedSong(recordJson);

    /**
     * Enable the save button once the intial dataload has been completed
     */
    document.getElementById('saveBtn').disabled = false;
}
function displaySavedSong(json) {
  // ideally, you would validate that the JSON here is matching the schema
  const section = document.createElement('section');
  const artistTag = document.createElement('p');
  const songTag = document.createElement('p');
  const albumArt = document.createElement('img');

  artistTag.textContent = json.name;
  songTag.textContent = json.track[0].name;

  section.appendChild(artistTag);
  section.appendChild(songTag);
  // section.appendChild(albumArt);

  document.getElementById('song-list').appendChild(section);
}

async function createEntry(e) {
  e.preventDefault();
  
  const {value: artistName} = document.getElementById('artist-name-1');
  const {value: artistSong} = document.getElementById('artist-song-1');

  // search spotify for the artist and song combination
  const trackData = await searchSpotify(artistName, artistSong);
  console.log(trackData.album.images[0]);
  return;
  /**
   * Santize the inputs and ensure that they are not blank before adding them to the data.
   */
  
  // if (artistName && artistName.trim())
  // if (artistSong && artistSong.trim())

  const json = convertToSchema(artistName, artistSong);

  // attempt to fetch the data from spotify
  // Write to the DWN record
  // const { record } = await web5.dwn.records.create({
  //   data: json,
  //   message: {
  //     schema: MUSIC_GROUP_SCHEMA_URL,
  //     dataFormat: 'application/json'
  //   }
  // });

  console.log(record);
}

async function searchSpotify(artistName, artistSong) {
  const baseURL =`https://api.spotify.com/v1/search?`;
  const santizedParams = new URLSearchParams(`q=artist:${artistName} track:${artistSong}&type=track`);
  const url = baseURL+santizedParams.toString();

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
  const tracks = data.tracks.items.filter(track => track.name.toLowerCase() === artistSong.toLowerCase());

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

function convertToSchema (artistName, artistSong) {
  return {
    '@type': 'MusicGroup',
    'name': artistName,
    'image': image ?? 'default-image.png',
    'track': [
      {
        '@type': 'MusicRecording',
        'name': artistSong
      }
    ]
  };
}