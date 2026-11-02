import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import MicPulse, { useSpeaking } from "./MicPulse";
import SpeechResultCard from "./SpeechResultCard";
import { createSttEngine } from "./sttEngine";
import { useVoiceSession } from "./useVoiceSession";
import { styles } from "./VoiceModal.styles";
import { getVoiceModalText } from "./voiceModalText";
import { toVoiceError, VOICE_STATUS } from "./voiceStatus";
import WaveformVisualizer from "./WaveformVisualizer";

// 인식 문장(speech.final)을 창에 보여준 뒤 전달·닫기까지 기다리는 시간
const RESULT_HOLD_MS = 800;

// 앱이 가로 고정(app.config.js orientation: "landscape")이므로 iOS Modal 방향을 명시 (화면 모양에는 영향 없음)
const SUPPORTED_ORIENTATIONS = [
  "landscape",
  "landscape-left",
  "landscape-right",
  "portrait",
];

/**
 * 음성 입력 모달 (디자인은 기존과 동일, 상태에 따라 문구만 바뀜)
 *
 * 1) 내부 상태 관리 (기본): 열릴 때 세션 시작, 닫힐 때 취소.
 *    engine 을 넘기지 않으면 sttEngine.js 의 기본 엔진을 쓴다 (.env EXPO_PUBLIC_USE_MOCK=true → 목데이터).
 *    기본 엔진도 없으면(API 미연결) "음성 인식 준비 중" 문구를 표시하고 가짜 결과를 만들지 않는다.
 * 2) 외부 제어: status / transcript / error 를 직접 넘기면 화면 표시만 담당한다.
 */
export default function VoiceModal({
  visible = true,
  onClose,
  onRetry,
  onComplete,
  engine,
  // 외부 제어용 (선택)
  status: statusProp,
  transcript: transcriptProp,
  error: errorProp,
  title: titleProp,
  subtitle: subtitleProp,
}) {
  const controlled = statusProp !== undefined;

  // 기본 STT 엔진 (창마다 하나, 다시 그려져도 유지)
  const defaultEngineRef = useRef(undefined);
  if (engine === undefined && defaultEngineRef.current === undefined) {
    defaultEngineRef.current = createSttEngine();
  }
  const activeEngine = engine !== undefined ? engine : defaultEngineRef.current;

  const session = useVoiceSession({
    engine: activeEngine ?? undefined,
    enabled: visible && !controlled,
    onSubmit: (text) => {
      if (onComplete) onComplete(text);
      else if (onClose) onClose();
    },
    resultHoldMs: RESULT_HOLD_MS,
  });
  // 말하는 도중 글자가 오는 엔진인지 (목데이터 실시간 모드: true / 실제 API: false)
  const realtimeText = controlled ? true : session.supportsPartial;

  const status = controlled ? statusProp : session.status;
  const transcript = controlled ? transcriptProp ?? "" : session.transcript;
  const error = controlled
    ? errorProp
      ? toVoiceError(errorProp)
      : null
    : session.error;

  const isListening = status === VOICE_STATUS.LISTENING;
  const hasTranscript = transcript.trim().length > 0;

  // 말하는 중이면 마이크 링이 커졌다 작아짐 (MicPulse.jsx)
  const speaking = useSpeaking({ transcript, isListening, realtimeText });

  const isProcessing = status === VOICE_STATUS.PROCESSING;
  // 처리 중에만 막고 나머지 상태에서는 항상 눌린다 (디자인상 비활성 표시가 없으므로)
  const canRetry = !isProcessing;
  // 전달 가능하면 말하기 완료(POST /speech/stop), 아니면 아무것도 보내지 않고 창만 닫는다
  // (실제 API 는 말하는 도중 글자가 없으므로 녹음 중이면 바로 완료 가능)
  const canSubmit = controlled ? isListening && hasTranscript : session.canComplete;
  const canComplete = !isProcessing;

  const text = getVoiceModalText({ status, error, realtimeText });
  const title = titleProp ?? text.title;
  const subtitle = subtitleProp ?? text.subtitle;

  const handleClose = () => {
    if (!controlled) session.cancel();
    if (onClose) onClose();
  };

  const handleRetry = () => {
    if (!canRetry) return;
    if (!controlled) session.retry();
    if (onRetry) onRetry();
  };

  const handleComplete = () => {
    if (!canComplete) return;
    if (!canSubmit) {
      // 전달할 문장이 없으면 빈 문장을 보내지 않고 닫기만 한다
      handleClose();
      return;
    }
    if (controlled) {
      if (onComplete) onComplete(transcript.trim());
      else if (onClose) onClose();
      return;
    }
    session.complete();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      supportedOrientations={SUPPORTED_ORIENTATIONS}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropPressable}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="말하기 취소하고 닫기"
        />

        <View style={styles.sheet} accessibilityViewIsModal>
          {/* 마이크 + 말하는 중 링 애니메이션 */}
          <MicPulse speaking={speaking} />

          {/* 타이틀 및 안내 문구 */}
          <Text style={styles.title} accessibilityRole="header" accessibilityLiveRegion="polite">
            {title}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* 파형 */}
          <View style={styles.waveform}>
            <WaveformVisualizer active={visible} />
          </View>

          <View style={styles.column}>
            {/* 실시간 음성 인식 카드 */}
            <SpeechResultCard text={transcript} placeholder={text.placeholder} />

            {/* 하단 액션 버튼 영역 */}
            <View style={styles.buttonRow}>
              {/* 다시 말하기 */}
              <Pressable
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && canRetry && styles.buttonPressed,
                ]}
                onPress={handleRetry}
                disabled={!canRetry}
                accessibilityRole="button"
                accessibilityLabel="다시 말하기"
                accessibilityHint="인식된 문장을 지우고 처음부터 다시 듣습니다"
                accessibilityState={{ disabled: !canRetry }}
              >
                <Ionicons name="sync-outline" size={19} color="#0B2741" />
                <Text style={styles.retryButtonText}>다시 말하기</Text>
              </Pressable>

              {/* 말하기 완료: 인식된 문장이 있을 때만 동작 */}
              <Pressable
                style={({ pressed }) => [
                  styles.completeButton,
                  pressed && canComplete && styles.buttonPressed,
                ]}
                onPress={handleComplete}
                disabled={!canComplete}
                accessibilityRole="button"
                accessibilityLabel="말하기 완료"
                accessibilityHint={
                  canSubmit ? "인식된 문장을 전달합니다" : "인식된 문장이 없어 창을 닫습니다"
                }
                accessibilityState={{
                  disabled: !canComplete,
                  busy: isProcessing,
                }}
              >
                <Text style={styles.completeButtonText}>말하기 완료</Text>
                <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
