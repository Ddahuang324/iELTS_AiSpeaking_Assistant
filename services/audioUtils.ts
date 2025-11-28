// Decodes base64 string to Uint8Array
export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Encodes Uint8Array to base64 string
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Decodes raw PCM data into an AudioBuffer using DataView for Little Endian safety
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  // Ensure we have an even number of bytes for 16-bit PCM
  const byteLength = data.byteLength - (data.byteLength % 2);
  const frameCount = byteLength / 2 / numChannels;

  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  const view = new DataView(data.buffer, data.byteOffset, byteLength);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    let offset = channel * 2;
    for (let i = 0; i < frameCount; i++) {
      // Gemini sends audio as Little Endian 16-bit PCM.
      // We clamp the reading to ensure we don't go out of bounds
      if (offset < byteLength) {
        const sample = view.getInt16(offset, true);
        channelData[i] = sample / 32768.0;
        offset += 2 * numChannels;
      } else {
        channelData[i] = 0;
      }
    }
  }
  return buffer;
}

// Converts Float32Array to Int16Array (no resampling)
export function float32ToInt16(float32Data: Float32Array): Int16Array {
  const int16Data = new Int16Array(float32Data.length);
  for (let i = 0; i < float32Data.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Data[i]));
    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Data;
}

// Resamples audio buffer to target sample rate (simple linear interpolation for real-time performance)
export function resampleTo16kHZ(
  audioData: Float32Array,
  origSampleRate: number
): Int16Array {
  const targetSampleRate = 16000;
  // If rates match, just convert format
  if (origSampleRate === targetSampleRate) {
    return float32ToInt16(audioData);
  }

  const ratio = origSampleRate / targetSampleRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Int16Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const originalIndex = i * ratio;
    const index1 = Math.floor(originalIndex);
    const index2 = Math.min(Math.ceil(originalIndex), audioData.length - 1);
    const weight = originalIndex - index1;

    // Linear interpolation
    const val = audioData[index1] * (1 - weight) + audioData[index2] * weight;

    // Clamp and convert to Int16
    const clamped = Math.max(-1, Math.min(1, val));
    result[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
  }

  return result;
}