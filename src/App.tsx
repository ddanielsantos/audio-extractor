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

	const extract = async (strategy: ExtractionStrategy, videoUrl: string) => {
		if (strategy === "ffmpeg") {
			if (!loaded) {
				try {
					const coreUrl = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
					const ffmpeg = ffmpegRef.current;
					await ffmpeg.load({
						coreURL: await toBlobURL(
							`${coreUrl}/ffmpeg-core.js`,
							"text/javascript",
						),
						wasmURL: await toBlobURL(
							`${coreUrl}/ffmpeg-core.wasm`,
							"application/wasm",
						),
						workerURL: await toBlobURL(
							`${coreUrl}/ffmpeg-core.worker.js`,
							"text/javascript",
						),
					});

					setLoaded(true);
				} catch (e) {
					console.error("Failed to load FFmpeg", e);
					return;
				}
			}

			setExtracting(true);
			const ffmpeg = ffmpegRef.current;
			const inputFile = "input.mp4";
			const outputFile = "output.aac";
			await ffmpeg.writeFile(inputFile, await fetchFile(videoUrl));
			try {
				await ffmpeg.exec([
					"-i",
					inputFile,
					"-vn",
					"-acodec",
					"copy",
					outputFile,
				]);
				const data = await ffmpeg.readFile(outputFile);
				return new Blob([data], { type: "audio/aac" });
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

		const videoUrl = URL.createObjectURL(file);
		console.time(`audio extraction - ${strategy}`);
		const audioBlob = await extract(strategy, videoUrl);
		console.timeEnd(`audio extraction - ${strategy}`);
		if (!audioBlob) {
			return;
		}

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
