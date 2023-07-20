import { Web5 } from 'https://cdn.jsdelivr.net/npm/@tbd54566975/web5@0.7.11/dist/browser.mjs';

const MUSIC_GROUP_SCHEMA_URL = 'https://schema.org/MusicGroup';
let web5;
let did;
let spotifyToken;

document.getElementById('saveBtn').onclick = createEntry;
window.onload = init;

async function init() {
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
  const albumArtTag = document.createElement('img');

  artistTag.textContent = json.name;
  songTag.textContent = json.track[0].name;
  
  albumArtTag.setAttribute('src', json.image || '/assets/default_image.jpg');
  albumArtTag.setAttribute('width', 200);
  section.appendChild(artistTag);
  section.appendChild(songTag);
  section.appendChild(albumArtTag);

  document.getElementById('song-list').appendChild(section);
}

async function createEntry(e) {
  e.preventDefault();

  const { value: artist } = document.getElementById('artist-name-1');
  const { value: track } = document.getElementById('artist-song-1');

/**
 * Santize the inputs and ensure that they are not blank before adding them to the data.
 */

// if (artist && artist.trim())
// if (track && track.trim())

  // search spotify for the artist and song combination
  const santizedParams = new URLSearchParams(`artist=${artist}&track=${track}`);
  const response = await fetch(`/music-info?${santizedParams.toString()}`);
  const trackData = await response.json();
  const image = trackData.album.images[0].url;

  document.getElementById('cover-art-1').setAttribute('src', trackData.album.images[0].url);

  const json = convertToSchema(artist, track, image);

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

function convertToSchema(artist, track, image) {
  return {
    '@type': 'MusicGroup',
    'name': artist,
    'image': image ?? 'default_image.jpg',
    'track': [
      {
        '@type': 'MusicRecording',
        'name': track,
      }
    ],
  };
}