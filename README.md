# audio-extractor

This project demonstrates client-side audio extraction from video files using two different strategies:

- FFmpeg (via WebAssembly)

- AudioContext API (currently a placeholder implementation)

## features

Select an extraction strategy.

Upload a video file.

Extract audio using the selected strategy.

Play the extracted audio directly in the browser.

## technologies used

- React: For the UI and handling state.

- FFmpeg.wasm: For video processing in the browser.

- TypeScript: For type safety.

## installation

Clone the repository:

```bash
git clone <repo_url>
cd <project_folder>
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

## how it works

FFmpeg Strategy

Loads FFmpeg.wasm and its dependencies.

Reads the uploaded video file and writes it to a virtual filesystem.

Runs an FFmpeg command to extract the audio stream (-vn -acodec copy).

Converts the extracted audio to a Blob and generates a playback URL.

AudioContext Strategy (To Be Implemented)

Currently, the AudioContext strategy is a placeholder and does not process audio yet.

## usage

Choose an extraction strategy (default: FFmpeg).

Upload a video file.

The extraction process starts, and the extracted audio appears as a playable element.

## future improvements

Implement the AudioContext strategy for in-browser audio extraction.

Support more output audio formats (MP3, WAV, etc.).

Improve error handling and UI feedback.