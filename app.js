import { Web5 } from 'https://cdn.jsdelivr.net/npm/@tbd54566975/web5@0.7.11/dist/browser.mjs';

let web5;
let did;

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
              schema: 'https://schema.org/MusicGroup'
            }
        }
    });
    console.log(records);

    /**
     * Enable the save button once the intial dataload has been completed
     */
    document.getElementById('saveBtn').disabled = false;
}

async function createEntry(e) {
  e.preventDefault();
  
  const {value: artistName} = document.getElementById('artist-name-1');
  const {value: artistSong} = document.getElementById('artist-song-1');

  /**
   * Santize the inputs and ensure that they are not blank before adding them to the data.
   */
  
  // if (artistName && artistName.trim())
  // if (artistSong && artistSong.trim())

  const json = createSchemaEntry(artistName, artistSong);

  console.log(json);
}

function createSchemaEntry (artistName, artistSong) {
  return {
    "@type": "MusicGroup",
    "name": artistName,
    "track": [
      {
        "@type": "MusicRecording",
        "name": artistSong
      }
    ]
  };
}