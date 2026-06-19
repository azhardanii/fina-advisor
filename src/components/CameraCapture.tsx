import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, X, RefreshCcw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setError("Gagal mengakses kamera. Pastikan browser memiliki izin.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const MAX_WIDTH = 1200;
      let width = video.videoWidth;
      let height = video.videoHeight;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, width, height);
        // Format as WebP to save size
        const base64Image = canvas.toDataURL('image/webp', 0.8);
        
        // Stop stream before closing
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        onCapture(base64Image);
      }
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button 
          onClick={onClose}
          className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors"
        >
          <X size={24} />
        </button>
        <button 
          onClick={toggleCamera}
          className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors"
        >
          <RefreshCcw size={24} />
        </button>
      </div>

      {/* Video Feed */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {error ? (
          <div className="text-white text-center p-4">
            <p>{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Overlay Scanner Guideline (Optional aesthetic) */}
        {!error && (
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/30 flex items-center justify-center">
            <div className="w-full h-full border-2 border-white/50 rounded-xl"></div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="h-32 bg-black flex items-center justify-center pb-safe shrink-0">
        <button
          onClick={handleCapture}
          disabled={!!error}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
            <Camera className="text-black" size={32} />
          </div>
        </button>
      </div>
    </div>,
    document.body
  );
}
