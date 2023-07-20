# Web5Music Application

## Overview
[Web5](https://developer.tbd.website/) powered app that allows users to save up to 3 songs. Songs are stored using [DWNs](https://tbd54566975.github.io/dwn-sdk-js/)

## Technology Stack
* [Web5](https://developer.tbd.website/)
* [Express](https://expressjs.com/)
* [node](https://nodejs.org)

## (Some) Design decisions
* This application uses the [Spotify Developer API](https://developer.spotify.com/documentation/web-api) to get access to the album art. This choice was due to the other APIs being more complex and requiring more calls to get the match of `artist` and `track` - not ideal.
* The Web5 implementation was done on the client side because I wanted to experiment with making the calls from the browser. There are already examples from TBD team members who have done node based examples.
* Related to the previous point, I decided to NOT use a front end framework because I wanted to find the first solution with no other factors (for example, integration issues).

## Future Thoughts
* A future implementation could be having this application with all API based calls on the server side only (included Web5 calls)
* This app could also be implemented using a frontend framework like Angular.

## Try the deployed version
[Deployed App](https://web5-music-a2117c9b330e.herokuapp.com/)

## Other notes
* Sometimes the web5 sync can take a few minutes and requires a refresh. I tried using the `send` method on the `record` instances to force the sync, but it still didn't have the outcome I was hoping for.