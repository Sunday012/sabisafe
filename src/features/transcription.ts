export interface TranscriptChunk {
  text: string
  timestamp: [number, number]
}

export interface TranscriptResult {
  text: string
  chunks: TranscriptChunk[]
  device: 'webgpu' | 'wasm'
}

export interface TranscriptionProgress {
  status: string
  progress?: number
  file?: string
}

type ProgressHandler = (progress: TranscriptionProgress) => void

interface WhisperOutput {
  text: string
  chunks?: TranscriptChunk[]
}

interface WhisperPipeline {
  (audio: string, options: { return_timestamps: boolean; chunk_length_s: number; stride_length_s: number }): Promise<WhisperOutput | WhisperOutput[]>
}

let cachedTranscriber: Promise<{ pipeline: WhisperPipeline; device: 'webgpu' | 'wasm' }> | null = null

async function getTranscriber(onProgress: ProgressHandler) {
  if (!cachedTranscriber) {
    cachedTranscriber = (async () => {
      const { pipeline } = await import('@huggingface/transformers')
      const device: 'webgpu' | 'wasm' = 'gpu' in navigator ? 'webgpu' : 'wasm'
      const whisper = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny.en', {
        device,
        dtype: 'q4',
        progress_callback: (event: unknown) => onProgress(event as TranscriptionProgress),
      })
      return { pipeline: whisper as unknown as WhisperPipeline, device }
    })()
  }
  return cachedTranscriber
}

export async function transcribeAudio(file: File, onProgress: ProgressHandler): Promise<TranscriptResult> {
  const { pipeline, device } = await getTranscriber(onProgress)
  const audioUrl = URL.createObjectURL(file)
  try {
    onProgress({ status: 'transcribing' })
    const raw = await pipeline(audioUrl, { return_timestamps: true, chunk_length_s: 30, stride_length_s: 5 })
    const output = Array.isArray(raw) ? raw[0] : raw
    return { text: output?.text.trim() ?? '', chunks: output?.chunks ?? [], device }
  } finally {
    URL.revokeObjectURL(audioUrl)
  }
}
