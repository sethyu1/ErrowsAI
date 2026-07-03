declare namespace API {
  namespace Chat {
    interface VOICE_CALL_INFO {
      user_voice_duration: number; // 用户语音时长，单位：秒
      call_duration: number; // 通话时长，单位：秒
      response_sentence_count: number; // 角色回复句子数量
    }

    // base64编码的WAV音频数据
    type RESPONSE_SENTENCE = string;

    interface SESSION_CALL_ERROR {
      code: number;
      message: string;
    }

    interface VOICE_CALL_COST {
      call_duration: number; // 通话时长，单位：秒
      cost: number; // 总费用，单位：coin
    }

    // HTTPS_SSE_RES<
    //   | SSE_EVENT<"voice_call_info", VOICE_CALL_INFO>
    //   | SSE_EVENT<"response_sentence", RESPONSE_SENTENCE>
    //   | SSE_EVENT<"error", SESSION_CALL_ERROR>
    //   | SSE_EVENT<"cost", VOICE_CALL_COST>
    //   | SSE_EVENT<"heartbeat", void>
    //   | SSE_EVENT<"end", void>
    // >;
  }
}
