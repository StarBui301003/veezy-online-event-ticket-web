import React, { useState } from 'react';
import FaceCapture from './FaceCapture';
import { loginByFaceAPI } from '@/services/auth.service';
import { useTranslation } from 'react-i18next';

interface FaceLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: unknown) => void;
}

interface FaceLoginResponse {
  flag: boolean;
  code: number;
  data?: {
    accessToken?: string;
    [key: string]: unknown;
  };
  message?: string;
}

function isFaceLoginResponse(obj: unknown): obj is FaceLoginResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'flag' in obj &&
    typeof (obj as { flag: unknown }).flag === 'boolean'
  );
}

const FaceLoginModal: React.FC<FaceLoginModalProps> = ({ open, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleCapture = async ({ image, embedding }: { image: Blob; embedding: number[] }) => {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      embedding.forEach((num, idx) => {
        formData.append(`FaceEmbedding[${idx}]`, num.toString());
      });
      formData.append('FaceImage', image, 'face.jpg');
      // If AccountId is required, add here
      const res = await loginByFaceAPI(formData);
      if (
        isFaceLoginResponse(res) &&
        res.flag &&
        res.data &&
        typeof res.data.accessToken === 'string'
      ) {
        onSuccess(res);
        onClose();
      } else {
        setError((isFaceLoginResponse(res) && res.message) || t('loginFailed'));
      }
    } catch {
      setError(t('cannotLoginFace'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
          aria-label={t('close')}
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-center">{t('faceLogin')}</h2>
        <FaceCapture onCapture={handleCapture} onError={setError} />
        {loading && (
          <div className="flex items-center justify-center mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-2 text-blue-600">{t('verifying')}</span>
          </div>
        )}
        {error && <div className="text-red-500 text-center mt-2">{error}</div>}
      </div>
    </div>
  );
};

export default FaceLoginModal; 