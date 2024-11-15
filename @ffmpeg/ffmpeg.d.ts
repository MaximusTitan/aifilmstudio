
declare module '@ffmpeg/ffmpeg' {
  export interface FFmpegOptions {
    log?: boolean;
    logger?: ({ type, message }: { type: string; message: string }) => void;
    progress?: (progress: { ratio: number }) => void;
    corePath?: string;
  }

  export interface FFmpeg {
    load(): Promise<void>;
    isLoaded(): boolean;
    run(...args: string[]): Promise<void>;
    FS(method: string, ...args: any[]): any;
    setProgress(callback: (progress: { ratio: number }) => void): void;
    setLogger(callback: ({ type, message }: { type: string; message: string }) => void): void;
  }

  export function createFFmpeg(options?: FFmpegOptions): FFmpeg;
  export function fetchFile(file: string | Blob | File | Buffer | Uint8Array): Promise<Uint8Array>;
}