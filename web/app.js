import { Web5 } from 'https://cdn.jsdelivr.net/npm/@tbd54566975/web5@0.7.11/dist/browser.mjs';

const MUSIC_GROUP_SCHEMA_URL = 'https://schema.org/MusicGroup';
let web5;
let did;
let rowsToCreate;

document.getElementById('saveBtn').onclick = createEntry;
window.onload = init;

/**
 * Initialization function that connects to Web5, queries the DWN data,
 * and displays any saved data.
 * @returns void
 */
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

  records.forEach(async (record) => {
    const recordJson = await record.data.json();
    displaySavedSong(recordJson);
  });

  rowsToCreate = 3 - records.length;
  createTrackEntryFormRows(rowsToCreate);

  /**
   * Enable the save button once the intial dataload has been completed
   */
  document.getElementById('saveBtn').disabled = rowsToCreate === 0 ? true : false;
  document.getElementById('main').style.display = 'initial';
  document.getElementById('loading-message').style.display = 'none';
}

/**
 * Create a DOM entry for a track based on the
 * provided json parameter.
 * @param {*} json track data matching the schema
 */
function displaySavedSong(json) {
  const trackList = document.getElementById('track-list');
  const range = document.createRange();
  range.selectNode(trackList);

  const documentFragment = range.createContextualFragment(`
    <section class="track-card">
      <img src="${json.image || '/assets/default_image.jpg'}" width="200">
      <div>
        <p class="track-artist">${json.name}</p>
        <p class="track-name">${json.track[0].name}</p>
      </div>
    </section>
  `);
  trackList.appendChild(documentFragment);
}

/**
 * Create a new DWN entry for each of the populated
 * artist and track input fields. Note, if one of the input
 * fields is missing, that entry will be ignored
 * @param {ClickEvent} e the click event 
 */
async function createEntry(e) {
  e.preventDefault();

  /**
   * For each of the elements on the screen get the artist name and song and
   * make the required queries. 
   */
  const trackEntryForm = document.getElementById('track-entry-form');

  for (let i = 0; i < rowsToCreate; i++) {
    const artistNode = document.getElementById(`artist-name-${i}`);
    const artistTrack = document.getElementById(`artist-track-${i}`);
    const trackEntryRow = document.getElementById(`track-entry-row-${i}`);

    if (artistNode === null || artistTrack === null) continue;

    let { value: artist } = artistNode;
    let { value: track } = artistTrack;

    artist = artist.trim();
    track = track.trim();

    /**
     * if the data for the track is empty or incomplete, go to the next available
     * set of nodes.
     */
    if (!artist || !track) continue;
    console.log(`artist "${artist}", track "${track}"`);

    const santizedParams = new URLSearchParams(`artist=${artist}&track=${track}`);

    // search spotify for the artist and song combination
    const response = await fetch(`/music-info?${santizedParams.toString()}`);
    const trackData = await response.json();
    const image = trackData.album.images[0].url;
    const json = convertToSchema(artist, track, image);

    // Write to the DWN record
    const { record } = await web5.dwn.records.create({
      data: convertToSchema(artist, track, image),
      message: {
        schema: MUSIC_GROUP_SCHEMA_URL,
        dataFormat: 'application/json'
      }
    });

    // Adding a force send here because the wait for the sync
    // may convince the user that something didn't work
    try {
      const { status } = await record.send(did);
    } catch (e) {
      console.log('an error occured during `send` while attempting to write to the DWN', e);
    }

    displaySavedSong(json);
    trackEntryForm.removeChild(trackEntryRow);
  }
}

/**
 * 
 * @param {String} artist name of the artist
 * @param {String} track name of the track
 * @param {String} image album cover image (if not provided will use default)
 * @returns JSON string in the format of the schema
 */
function convertToSchema(artist, track, image) {
  return {
    '@type': 'MusicGroup',
    'name': artist,
    'image': image ?? '/assets/default_image.jpg',
    'track': [
      {
        '@type': 'MusicRecording',
        'name': track,
      }
    ],
  };
}

/**
 * Deletes the entries from the DWN
 */
async function deleteEntries() {
  const { records } = await web5.dwn.records.query({
    from: did,
    message: {
      filter: {
        schema: MUSIC_GROUP_SCHEMA_URL
      }
    }
  });

  for (let i = 0; i < records.length; i++) {
    try {
      await records[i].delete();
      const { status } = await records[i].send(did);
      console.log('send status:', status);
    } catch (e) {
      console.log('error occurred during `send` after attempting to delete', e);
    }
  }

  // Display track entry forms
  createTrackEntryFormRows(3);
  // remove the entries from the UI
  document.getElementById('track-list').innerHTML = '';

  console.log('All DWN entries have been deleted');
}

/**
 * Utility function to create track entry rows for users
 * to input the track name and the artist name
 * 
 * @param {Number} rowsToCreate number of rows to create
 */
function createTrackEntryFormRows(rowsToCreate) {
  const formElement = document.getElementById('track-entry-form');

  for (let i = 0; i < rowsToCreate; i++) {
    const range = document.createRange();
    range.selectNode(formElement);
    const documentFragment = range.createContextualFragment(`
      <div id="track-entry-row-${i}" class="track-entry">
        <label for="artist-name-${i}">Artist Name</label>
        <input type="text" id="artist-name-${i}" placeholder="Artist Name">

        <label for="artist-track-${i}">Artist Song</label>
        <input type="text" id="artist-track-${i}" placeholder="Track Name">
      </div>
    `);
    formElement.prepend(documentFragment);
  }
}