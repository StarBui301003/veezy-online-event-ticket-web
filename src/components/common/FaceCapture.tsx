import React, { useState, useRef, useEffect } from 'react';
import { Camera, RotateCcw, Check, X, AlertCircle, Scan, Shield, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FaceCaptureProps {
  onCapture: (result: { image: Blob }) => void;
  onError?: (err: string) => void;
  onCancel?: () => void;
}

const FaceCapture: React.FC<FaceCaptureProps> = ({ onCapture, onError, onCancel }) => {
  const { t } = useTranslation();
  const [captureStep, setCaptureStep] = useState<
    'permission' | 'capture' | 'processing' | 'success' | 'error'
  >('permission');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [videoBlackCount, setVideoBlackCount] = useState(0); // Đếm số lần video bị đen
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  // Thêm state để lưu blob ảnh đã chụp
  const [capturedImageBlob, setCapturedImageBlob] = useState<Blob | null>(null);
  // State để kiểm soát loading khi xác nhận
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hàm tạo lại stream mới nếu video bị đen nhiều lần
  const recreateStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
      setVideoBlackCount(0);
      setFaceDetected(false);
      setTimeout(() => setFaceDetected(true), 2000);
    } catch {
      onError?.('Không thể truy cập camera.');
      setCaptureStep('error');
    }
  };

  // Khi phát hiện video bị đen quá 2 lần, tạo lại stream
  useEffect(() => {
    if (videoBlackCount >= 2) {
      recreateStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoBlackCount]);

  // Đảm bảo video luôn giữ stream, không bị đen khi phát hiện khuôn mặt
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
      // Nếu video bị đen (srcObject null hoặc video.paused), tăng biến đếm
      setTimeout(() => {
        if (videoRef.current && (!videoRef.current.srcObject || videoRef.current.paused)) {
          setVideoBlackCount((c) => c + 1);
        }
      }, 500);
    }
  }, [stream, faceDetected, captureStep]);

  // Khi faceDetected đổi trạng thái, kiểm tra video có bị đen không
  useEffect(() => {
    if (faceDetected && videoRef.current) {
      if (!videoRef.current.srcObject && stream) {
        videoRef.current.srcObject = stream;
      }
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [faceDetected, stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
      setCaptureStep('capture');
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      // Simulate face detection
      setTimeout(() => {
        setFaceDetected(true);
      }, 2000);
    } catch {
      onError?.('Không thể truy cập camera.');
      setCaptureStep('error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Log khi stream bị inactive (bị dừng)
  useEffect(() => {
    if (!stream) return;
    const handleInactive = () => {};
    stream.addEventListener('inactive', handleInactive);
    // Nếu đã inactive thì log luôn
    return () => {
      stream.removeEventListener('inactive', handleInactive);
    };
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCapturedImage(URL.createObjectURL(blob));
            setCapturedImageBlob(blob); // Lưu lại blob ảnh
            setCaptureStep('processing');
            // Simulate AI processing
            setTimeout(() => {
              setCaptureStep('success');
              setSuccessId(`FV-2025-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
              // KHÔNG gọi onCapture ở đây nữa!
            }, 2000);
          } else {
            onError?.('Không thể lấy ảnh từ camera.');
            setCaptureStep('error');
          }
        },
        'image/jpeg',
        0.95
      );
    }
  };

  const startCountdown = () => {
    if (!faceDetected) return;
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          capturePhoto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetCapture = () => {
    stopCamera();
    setCaptureStep('permission');
    setCapturedImage(null);
    setCountdown(0);
    setFaceDetected(false);
    setSuccessId(null);
    if (onCancel) onCancel();
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stopCamera();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đảm bảo UI không có overlay che video ở mọi trạng thái capture
  // (đã đúng ở CaptureStep, không render overlay gradient che video)

  const PermissionStep = () => (
    <div className="text-center space-y-4">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
        <Shield className="w-12 h-12 text-white" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-white mb-4">{t('faceVerification')}</h2>
        <p className="text-gray-300 text-lg max-w-md mx-auto">{t('faceVerificationDescription')}</p>
      </div>
      <div className="bg-gray-800/50 rounded-2xl p-6 max-w-md mx-auto mt-2">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-400" />
          {t('instructions')}
        </h3>
        <ul className="text-gray-300 space-y-2 text-left">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>{t('ensureGoodLighting')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>{t('lookStraightAtCamera')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>{t('removeGlassesOrMask')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>{t('keepHeadStraight')}</span>
          </li>
        </ul>
      </div>
      <button
        onClick={startCamera}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto"
      >
        <Camera className="w-6 h-6" />
        {t('startVerification')}
      </button>
    </div>
  );

  const ProcessingStep = () => (
    <div className="text-center space-y-8">
      <div className="relative">
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured face"
            className="w-80 h-80 object-cover rounded-3xl mx-auto border-4 border-blue-400"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-3xl"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-semibold">{t('processing')}</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">{t('verifying')}</h2>
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
            <span>{t('verificationProgress')}</span>
            <span>85%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse"
              style={{ width: '85%' }}
            ></div>
          </div>
        </div>
        <div className="space-y-2 text-gray-300">
          <div className="flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span>{t('faceDetected')}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span>{t('analyzeFeatures')}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span>{t('identityVerification')}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const SuccessStep = () => (
    <div className="text-center space-y-8">
      <div className="relative">
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Verified face"
            className="w-80 h-80 object-cover rounded-3xl mx-auto border-4 border-green-400"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-3xl"></div>
      </div>
      <div className="space-y-4">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white">{t('verificationSuccess')}</h2>
        <p className="text-gray-300 text-lg max-w-md mx-auto">{t('faceVerified')}</p>
        <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-4 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-green-400" />
            <div className="text-left">
              <p className="text-white font-semibold">{t('identityVerified')}</p>
              <p className="text-green-400 text-sm">
                {t('identityId')}: #{successId}
              </p>
            </div>
          </div>
        </div>
      </div>
      {!isSubmitting ? (
        <div className="flex gap-4 justify-center">
          <button
            onClick={async () => {
              if (capturedImageBlob) {
                setIsSubmitting(true);
                try {
                  await onCapture({ image: capturedImageBlob });
                } finally {
                  setIsSubmitting(false);
                }
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg"
          >
            {t('confirm')}
          </button>
          <button
            onClick={resetCapture}
            className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center gap-3"
          >
            <RotateCcw className="w-5 h-5" />
            {t('retake')}
          </button>
        </div>
      ) : (
        <div className="text-lg text-blue-500 font-semibold mt-6">{t('pleaseWait')}</div>
      )}
    </div>
  );

  const ErrorStep = () => (
    <div className="text-center space-y-8">
      <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto">
        <X className="w-12 h-12 text-white" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-white mb-4">{t('cannotAccessCamera')}</h2>
        <p className="text-gray-300 text-lg max-w-md mx-auto">{t('pleaseAllowCameraAccess')}</p>
      </div>
      <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4 max-w-md mx-auto">
        <h3 className="text-red-400 font-semibold mb-2">{t('fixCamera')}</h3>
        <ul className="text-gray-300 space-y-1 text-left text-sm">
          <li>• {t('checkCameraPermission')}</li>
          <li>• {t('ensureCameraIsNotUsedByOtherApps')}</li>
          <li>• {t('refreshPageAndTryAgain')}</li>
        </ul>
      </div>
      <button
        onClick={resetCapture}
        className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105"
      >
        {t('retry')}
      </button>
    </div>
  );

  // UI: Video element luôn giữ nguyên, chỉ overlay UI lên trên
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full border border-gray-700/50 flex flex-col items-center justify-center mx-auto relative">
        <canvas ref={canvasRef} className="hidden" />
        {/* Video element luôn giữ nguyên, overlay UI lên trên */}
        <div className="relative w-full flex justify-center items-center mb-6">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-96 object-cover rounded-3xl border border-gray-700"
            style={{ background: '#000' }}
          />
          {/* Overlay UI tuỳ theo step */}
          {captureStep === 'permission' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
              <PermissionStep />
            </div>
          )}
          {captureStep === 'processing' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
              <ProcessingStep />
            </div>
          )}
          {captureStep === 'success' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
              <SuccessStep />
            </div>
          )}
          {captureStep === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <ErrorStep />
            </div>
          )}
          {/* Step capture: overlay border, status, countdown... */}
          {captureStep === 'capture' && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              {/* Border và hiệu ứng, KHÔNG có overlay che video */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`relative w-64 h-80 rounded-3xl border-4 transition-all duration-300 ${
                    faceDetected
                      ? 'border-green-400 shadow-lg shadow-green-400/50'
                      : 'border-blue-400 shadow-lg shadow-blue-400/50'
                  }`}
                >
                  {/* Corner indicators */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-4 border-b-4 border-white rounded-br-lg"></div>
                  {/* Scanning animation - KHÔNG render lớp phủ gradient che video */}
                  {faceDetected && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse rounded-t-3xl"></div>
                  )}
                  {/* Center dot */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        faceDetected ? 'bg-green-400' : 'bg-blue-400'
                      } animate-ping`}
                    ></div>
                  </div>
                </div>
              </div>
              {/* Status indicators */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    faceDetected ? 'bg-green-400' : 'bg-blue-400'
                  } animate-pulse`}
                ></div>
                <span className="text-white text-sm font-medium">
                  {faceDetected ? t('faceDetected') : t('detectingFace')}
                </span>
              </div>
              {/* Countdown overlay */}
              {countdown > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl font-bold text-white mb-4">{countdown}</div>
                    <p className="text-white text-xl">{t('capturing')}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Nút điều khiển chỉ hiện ở step capture */}
        {captureStep === 'capture' && (
          <div className="flex gap-4 justify-center">
            <button
              onClick={startCountdown}
              disabled={!faceDetected || countdown > 0}
              className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center gap-3 ${
                faceDetected
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white transform hover:scale-105'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Scan className="w-6 h-6" />
              {t('capturePhoto')}
            </button>
            <button
              onClick={resetCapture}
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center gap-3"
            >
              <X className="w-6 h-6" />
              {t('cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceCapture;
