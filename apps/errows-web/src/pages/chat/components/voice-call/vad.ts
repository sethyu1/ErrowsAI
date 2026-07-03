// VAD 配置
export interface VADConfig {
  speechThreshold: number; // 语音检测阈值 (dB)
  silenceThreshold: number; // 静音检测阈值 (dB)
  minSpeechDuration: number; // 最少语音时长 (ms)
  silenceDelay: number; // 静音后延迟结束 (ms)
  sampleRate: number; // 采样率
  speechConfirmFrames: number; // 确认语音开始需要的连续帧数
}

export const defaultVADConfig: VADConfig = {
  speechThreshold: -45, // 语音开始阈值 (dB)，越大越不敏感
  silenceThreshold: -50, // 静音阈值 (dB)
  minSpeechDuration: 300, // 最少300ms
  silenceDelay: 1000, // 静音后1.5秒结束
  sampleRate: 16000,
  speechConfirmFrames: 3, // 连续3帧确认语音开始
};

// 自定义 VAD 类 - 基于 WebAudio API（改进版）
export class SimpleVAD {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private config: VADConfig;

  private isSpeaking = false;
  private speechStartTime = 0;
  private lastSpeechTime = 0;
  private audioChunks: Float32Array[] = [];
  private detectionInterval: number | null = null;
  private enabled = true;

  // 语音确认计数器
  private speechConfirmCount = 0;
  // 防止重复触发
  private isProcessingEnd = false;

  private onSpeechStart?: () => void;
  private onSpeechEnd?: (audio: Float32Array) => void;
  private onVADMisfire?: () => void;

  constructor(config: Partial<VADConfig> = {}) {
    this.config = { ...defaultVADConfig, ...config };
  }

  async start(callbacks: {
    onSpeechStart?: () => void;
    onSpeechEnd?: (audio: Float32Array) => void;
    onVADMisfire?: () => void;
  }) {
    this.onSpeechStart = callbacks.onSpeechStart;
    this.onSpeechEnd = callbacks.onSpeechEnd;
    this.onVADMisfire = callbacks.onVADMisfire;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });
      const source = this.audioContext.createMediaStreamSource(
        this.mediaStream
      );

      // 创建分析器 - 使用较小的 fftSize 提高响应速度
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.5;

      // 创建录音处理器
      this.scriptProcessor = this.audioContext.createScriptProcessor(
        2048,
        1,
        1
      );
      this.scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // 始终录制，但只在 isSpeaking 时保存
        if (this.isSpeaking) {
          this.audioChunks.push(new Float32Array(inputData));
        }
      };

      source.connect(this.analyser);
      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.startDetection();
      console.log("[VAD] 启动成功，阈值:", this.config.speechThreshold, "dB");
    } catch (error) {
      console.error("[VAD] 启动失败:", error);
      throw error;
    }
  }

  // 计算音量 (dB)
  private calculateDB(): number {
    const dataArray = new Float32Array(this.analyser!.fftSize);
    this.analyser!.getFloatTimeDomainData(dataArray);

    // 计算 RMS
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);

    // 转换为 dB
    const db = 20 * Math.log10(Math.max(rms, 1e-10));
    return db;
  }

  private startDetection() {
    // 使用 setInterval 确保在后台也能运行
    this.detectionInterval = window.setInterval(() => {
      // 如果禁用，跳过检测
      if (!this.enabled) {
        return;
      }
      
      const db = this.calculateDB();
      const now = Date.now();

      if (!this.isSpeaking) {
        // 检测语音开始 - 需要连续多帧确认
        if (db > this.config.speechThreshold) {
          this.speechConfirmCount++;

          if (this.speechConfirmCount >= this.config.speechConfirmFrames) {
            this.isSpeaking = true;
            this.speechStartTime = now;
            this.lastSpeechTime = now;
            this.audioChunks = [];
            this.speechConfirmCount = 0;
            console.log("[VAD] 语音开始，音量:", db.toFixed(1), "dB");
            this.onSpeechStart?.();
          }
        } else {
          this.speechConfirmCount = 0;
        }
      } else {
        // 检测语音是否继续
        if (db > this.config.silenceThreshold) {
          this.lastSpeechTime = now;
        }

        const silenceDuration = now - this.lastSpeechTime;

        if (silenceDuration > this.config.silenceDelay) {
          // 静音超时，结束语音
          const speechDuration =
            now - this.speechStartTime - this.config.silenceDelay;

          console.log("[VAD] 静音检测，语音时长:", speechDuration, "ms");

          // 先重置所有状态，防止重复触发
          this.isSpeaking = false;
          this.speechStartTime = 0;
          this.lastSpeechTime = 0;
          this.speechConfirmCount = 0;
          const chunks = this.audioChunks;
          this.audioChunks = [];

          if (
            speechDuration >= this.config.minSpeechDuration &&
            chunks.length > 0
          ) {
            // 合并音频数据
            const totalLength = chunks.reduce(
              (sum, arr) => sum + arr.length,
              0
            );
            const mergedAudio = new Float32Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
              mergedAudio.set(chunk, offset);
              offset += chunk.length;
            }
            console.log("[VAD] 语音结束，采集:", totalLength, "样本");
            this.onSpeechEnd?.(mergedAudio);
          } else {
            console.log("[VAD] 语音太短，忽略");
            this.onVADMisfire?.();
          }
        }
      }
    }, 50); // 每50ms检测一次
  }

  pause() {
    // 先清除回调，防止后续触发
    this.onSpeechStart = undefined;
    this.onSpeechEnd = undefined;
    this.onVADMisfire = undefined;

    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.isSpeaking = false;
    this.audioChunks = [];
    this.speechConfirmCount = 0;
    this.speechStartTime = 0;
    this.lastSpeechTime = 0;
    console.log("[VAD] 已停止");
  }

  // 暂停监听（不关闭音频流）
  pauseListening() {
    this.enabled = false;
    // 如果正在说话，重置状态
    if (this.isSpeaking) {
      this.isSpeaking = false;
      this.audioChunks = [];
      this.speechConfirmCount = 0;
      this.speechStartTime = 0;
      this.lastSpeechTime = 0;
    }
    console.log("[VAD] 监听已暂停");
  }

  // 恢复监听
  resumeListening() {
    this.enabled = true;
    console.log("[VAD] 监听已恢复");
  }
}
