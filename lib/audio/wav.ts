// Browser-side WAV encoder.
//
// MediaRecorder on Chromium/Firefox emits webm/opus. OpenAI's
// gpt-4o-audio-preview only accepts wav or mp3 input, and silently rejects
// bytes that don't match the declared format. So we decode the recorded
// blob with WebAudio (which handles webm, mp4, ogg, wav natively), then
// re-encode as 16-bit mono PCM WAV before upload.
//
// Mono and 16 kHz is enough for cry analysis and keeps the payload small
// (~30 KB/sec) so we stay well under Vercel's request size limits.
const TARGET_SAMPLE_RATE = 16_000;

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export async function blobToWav(blob: Blob): Promise<Blob> {
  const Ctor = getAudioContextCtor();
  if (!Ctor) {
    // No WebAudio — return original blob; server may still cope.
    return blob;
  }

  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new Ctor();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    void ctx.close();
  }

  // Downsample to mono at TARGET_SAMPLE_RATE using OfflineAudioContext.
  const targetLen = Math.floor(
    (decoded.duration * TARGET_SAMPLE_RATE)
  );
  const offline = new OfflineAudioContext(1, targetLen, TARGET_SAMPLE_RATE);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start(0);
  const rendered = await offline.startRendering();

  // Pull mono PCM samples.
  const channelData = rendered.getChannelData(0);
  return encodeWav(channelData, TARGET_SAMPLE_RATE);
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2; // 16-bit
  const numChannels = 1;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  // fmt chunk
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  // data chunk
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Float32 [-1,1] → Int16 little-endian
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}
