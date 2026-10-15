export interface ToneOptions {
  /** 音调频率（Hz） */
  frequency: number;
  /** 时长（秒） */
  duration: number;
  /** 采样率，默认 8000（16-bit PCM 单声道） */
  sampleRate?: number;
}

/** 生成正弦波 WAV dataURL，可直接作为 Howl 的 src，纯前端运行无需外部音频文件 */
export function createToneWav({ frequency, duration, sampleRate = 8000 }: ToneOptions): string {
  const samples = Math.floor(duration * sampleRate);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt 块大小
  view.setUint16(20, 1, true); // PCM 格式
  view.setUint16(22, 1, true); // 单声道
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // 字节速率
  view.setUint16(32, 2, true); // 块对齐
  view.setUint16(34, 16, true); // 位深
  writeAscii(view, 36, 'data');
  view.setUint32(40, samples * 2, true);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    // 首尾 20ms 淡入淡出，避免爆音
    const fade = Math.min(1, Math.min(i, samples - 1 - i) / (sampleRate * 0.02));
    const amplitude = Math.sin(2 * Math.PI * frequency * t) * 0.6 * fade;
    view.setInt16(44 + i * 2, Math.round(amplitude * 32767), true);
  }

  return `data:audio/wav;base64,${toBase64(new Uint8Array(buffer))}`;
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
