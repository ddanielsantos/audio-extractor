import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { type ChangeEvent, useRef, useState } from "react";

type ExtractionStrategy = "ffmpeg" | "audio_context";

function App() {
	const [loaded, setLoaded] = useState(false);
	const [strategy, setStrategy] = useState<ExtractionStrategy>("ffmpeg");
	const ffmpegRef = useRef(new FFmpeg());
	const [extracting, setExtracting] = useState(false);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);

	/**
	 * Loads FFmpeg and its necessary files.
	 *
	 * @returns {Promise<void>} A promise that resolves when FFmpeg is loaded.
	 */
	const loadFFmpeg = async (): Promise<void> => {
		const coreUrl = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
		const ffmpeg = ffmpegRef.current;
		await ffmpeg.load({
			coreURL: await toBlobURL(`${coreUrl}/ffmpeg-core.js`, "text/javascript"),
			wasmURL: await toBlobURL(
				`${coreUrl}/ffmpeg-core.wasm`,
				"application/wasm",
			),
		});
	};

	async function getCodec(ffmpeg: FFmpeg, inputFile: string) {
		let ffmpegLogs = "";
		ffmpeg.on("log", (ev) => {
			ffmpegLogs = ffmpegLogs + `${ev.message}\n`;
		});

		await ffmpeg.exec(["-i", inputFile]);
		const matches = ffmpegLogs.match(/Audio: (\w+)/);
		return matches ? matches[1] : "";
	}

	/**
	 * Extracts audio from a video file using FFmpeg.
	 *
	 * @param {string} videoUrl - The URL of the video file to extract audio from.
	 * @param {string} ext - The extension of the video file.
	 * @returns {Promise<Blob | undefined>} A promise that resolves to a Blob containing the extracted audio.
	 */
	const extractWithFFmpeg = async (
		videoUrl: string,
		ext: string,
	): Promise<Blob | undefined> => {
		const ffmpeg = ffmpegRef.current;
		const inputFile = `input.${ext}`;
		await ffmpeg.writeFile(inputFile, await fetchFile(videoUrl));
		const codec = await getCodec(ffmpeg, inputFile);

		if (!codec) {
			return;
		}

		// mp3 and aac streams can be copied directly without re-encoding
		const outputFile = codec === "mp3" ? "output.mp3" : "output.mp4";
		const type = "audio/mpeg";
		let ffmpegLogs = "";
		ffmpeg.on("log", ({ message }) => ffmpegLogs += `${message}\n`);
		if (["aac", "mp3"].includes(codec)) {
			await ffmpeg.exec([
				"-i",
				inputFile,
				"-map",
				"0:a",
				"-c:a",
				"copy",
				outputFile,
			]);
		} else {
			await ffmpeg.exec([
				"-i",
				inputFile,
				"-map",
				"0:a",
				"-c:a",
				"aac",
				"-b:a",
				"192k",
				outputFile,
			]);
		}
		console.info(ffmpegLogs);

		const data = await ffmpeg.readFile(outputFile);
		if (data instanceof Uint8Array) {
			return new Blob([data.buffer], { type });
		}

		return;
	};

	/**
	 * Extracts audio from a video file using the specified strategy.
	 *
	 * @param {ExtractionStrategy} strategy - The strategy to use for extraction ("ffmpeg" or "audio_context").
	 * @param {string} videoUrl - The URL of the video file to extract audio from.
	 * @param {string} ext - The extension of the video file.
	 * @returns {Promise<Blob | undefined>} A promise that resolves to a Blob containing the extracted audio, or undefined if extraction fails.
	 */
	const extract = async (
		strategy: ExtractionStrategy,
		videoUrl: string,
		ext: string,
	): Promise<Blob | undefined> => {
		if (strategy === "ffmpeg") {
			if (!loaded) {
				try {
					await loadFFmpeg();
					setLoaded(true);
				} catch (e) {
					console.error("Failed to load FFmpeg", e);
					return;
				}
			}

			setExtracting(true);
			try {
				return await extractWithFFmpeg(videoUrl, ext);
			} catch (e) {
				console.error("Failed to extract audio", e);
			} finally {
				setExtracting(false);
			}
		}

		if (strategy === "audio_context") {
			setExtracting(true);
			setExtracting(false);
			return new Blob();
		}

		return;
	};

	const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.item(0);
		if (!file) {
			return;
		}

		const ext = file.name.split(".").pop();
		if (!ext) {
			return;
		}

		console.log(file.size)

		const videoUrl = URL.createObjectURL(file);
		console.time(`audio extraction - ${strategy}`);
		const audioBlob = await extract(strategy, videoUrl, ext);
		console.timeEnd(`audio extraction - ${strategy}`);
		if (!audioBlob) {
			return;
		}

		console.log(audioBlob.size)
		setAudioUrl(URL.createObjectURL(audioBlob));
	};

	return (
		<>
			<div>
				<select
					value={strategy}
					onChange={(e) => setStrategy(e.target.value as ExtractionStrategy)}
				>
					<option value="ffmpeg">FFmpeg</option>
					<option value="audio_context">AudioContext</option>
				</select>
			</div>
			<input type="file" accept="video/*" onChange={handleInputChange} />
			{extracting && <div>Extracting...</div>}
			{/* biome-ignore lint/a11y/useMediaCaption: captions will be generated later */}
			{audioUrl && <audio controls src={audioUrl} />}
		</>
	);
}

export default App;
