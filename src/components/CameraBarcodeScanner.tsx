import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import jsQR from 'jsqr';

interface CameraBarcodeScannerProps {
  onScanSuccess: (decodedText: string, formatName?: string) => void;
  onClose?: () => void;
  isCompact?: boolean;
  autoStart?: boolean;
}

export const CameraBarcodeScanner: React.FC<CameraBarcodeScannerProps> = ({
  onScanSuccess,
  onClose,
  isCompact = false,
  autoStart = true,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [lastDetected, setLastDetected] = useState<{ text: string; time: string } | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileScanError, setFileScanError] = useState<string | null>(null);

  const scannerRegionId = useRef(`qr-reader-${Math.random().toString(36).substring(2, 9)}`);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  // Play audio chime when barcode is detected
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // Quick up-chirp
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.13);
    } catch {
      // Audio context might be restricted before user gesture
    }

    // Haptic vibration on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(80);
      } catch {
        // Ignore vibration errors
      }
    }
  };

  // Safe handler for successful detection with debouncing
  const handleDecoded = useCallback((decodedText: string, formatName?: string) => {
    const now = Date.now();
    // Debounce detections of identical text within 1.5 seconds
    if (now - lastScannedTimeRef.current < 1500) {
      return;
    }
    lastScannedTimeRef.current = now;

    playBeep();
    setLastDetected({
      text: decodedText,
      time: new Date().toLocaleTimeString(),
    });

    onScanSuccess(decodedText, formatName);
  }, [onScanSuccess]);

  // Enumerate cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (cameras && cameras.length > 0) {
          setAvailableCameras(cameras as unknown as MediaDeviceInfo[]);
          // Prefer back/environment camera
          const backCam = cameras.find((c) =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : cameras[0].id);
        }
      })
      .catch(() => {
        // Camera enumeration error (might require permission first)
      });
  }, []);

  // Initialize and start scanner
  const startScanner = useCallback(async (cameraId?: string) => {
    setCameraError(null);

    try {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
        } catch {
          // Ignore stop errors
        }
      }

      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
        Html5QrcodeSupportedFormats.ITF,
      ];

      const html5QrCode = new Html5Qrcode(scannerRegionId.current, {
        formatsToSupport,
        verbose: false,
      });
      html5QrCodeRef.current = html5QrCode;

      const cameraConfig = cameraId
        ? { deviceId: { exact: cameraId } }
        : { facingMode: 'environment' };

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          return {
            width: Math.floor(minEdge * 0.85),
            height: Math.floor(minEdge * (isCompact ? 0.75 : 0.65)),
          };
        },
        aspectRatio: isCompact ? 16 / 9 : 1.333,
      };

      await html5QrCode.start(
        cameraConfig,
        config,
        (decodedText, result) => {
          const format = result.result?.format?.formatName || 'BARCODE';
          handleDecoded(decodedText, format);
        },
        () => {
          // Frame parsed with no barcode found, perfectly normal
        }
      );

      setIsScanning(true);

      // Check for torch capability
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        if ('torch' in capabilities) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: unknown) {
      console.warn('Camera scanner initialization issue:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission denied')) {
        setCameraError('Camera access denied. Please grant camera permissions in your browser or iframe.');
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError(`Camera initialization note: ${errMsg}. You can use sample test barcodes below or upload an image.`);
      }
      setIsScanning(false);
    }
  }, [handleDecoded, isCompact]);

  // Stop scanner
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch {
        // Ignore cleanup errors
      }
      html5QrCodeRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  }, []);

  // Toggle torch / flashlight
  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Image file scan fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setFileScanError(null);
    setIsProcessingFile(true);
    await stopScanner();

    const reader = new FileReader();
    reader.onerror = () => {
      setFileScanError('Could not read the selected image.');
      setIsProcessingFile(false);
    };
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 1600;
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setFileScanError('Could not process the selected image.');
          setIsProcessingFile(false);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, canvas.width, canvas.height);
        if (qrCode && qrCode.data) {
          handleDecoded(qrCode.data, 'QR_CODE_IMAGE');
          setIsProcessingFile(false);
        } else {
          const fileScanner = new Html5Qrcode(scannerRegionId.current, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.ITF,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
            verbose: false,
          });
          fileScanner
            .scanFile(file, true)
            .then((res) => {
              handleDecoded(res, 'IMAGE_BARCODE');
              return fileScanner.clear();
            })
            .catch(() => {
              setFileScanError('Could not detect a clear barcode. Use a sharp, front-facing photo with no cropping.');
            })
            .finally(() => {
              setIsProcessingFile(false);
            });
        }
      };
      img.onerror = () => {
        setFileScanError('The selected file is not a supported image.');
        setIsProcessingFile(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Auto start on mount
  useEffect(() => {
    if (autoStart) {
      startScanner(selectedCameraId || undefined);
    }
    return () => {
      stopScanner();
    };
  }, [autoStart, selectedCameraId, startScanner, stopScanner]);

  return (
    <div className={`relative flex flex-col bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden ${isCompact ? 'p-3' : 'p-4'}`}>
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            {isScanning && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-on-surface">Device Camera Scanner</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${isScanning ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-surface-container text-outline'}`}>
                {isScanning ? 'ACTIVE STREAM' : 'PAUSED'}
              </span>
            </div>
            <p className="text-[10px] text-outline">
              Point camera at Eyewear 35x15mm tags, Lab Conveyor Trays, or Patient QR codes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {hasTorch && isScanning && (
            <button
              onClick={handleToggleTorch}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${torchOn ? 'bg-amber-400 text-black border-amber-500' : 'bg-surface-container text-on-surface border-outline-variant'}`}
              title="Toggle Flashlight / Torch"
            >
              <span className="material-symbols-outlined text-[16px]">
                {torchOn ? 'flashlight_on' : 'flashlight_off'}
              </span>
            </button>
          )}

          {availableCameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                startScanner(e.target.value);
              }}
              className="h-8 text-[11px] px-2 bg-surface-container border border-outline-variant rounded-lg text-on-surface focus:outline-none"
            >
              {availableCameras.map((cam, idx) => (
                <option key={cam.deviceId || idx} value={cam.deviceId}>
                  {cam.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          )}

          {isScanning ? (
            <button
              onClick={stopScanner}
              className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg text-[11px] font-bold text-on-surface cursor-pointer"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={() => startScanner(selectedCameraId || undefined)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]">videocam</span>
              <span>Start</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Video Viewfinder Container */}
      <div className={`relative w-full rounded-xl overflow-hidden bg-black/90 ${isCompact ? 'h-[clamp(140px,25vh,220px)]' : 'aspect-4/3'} flex items-center justify-center border border-outline-variant`}>
        {/* HTML5 QR code viewport element */}
        <div
          id={scannerRegionId.current}
          className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
        />

        {/* Optical Viewfinder Overlays when scanning */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Dark vignette corners */}
            <div className="absolute inset-0 bg-black/25" />

            {/* Targeting Recticle Box */}
            <div className="relative w-[75%] h-[65%] border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.3)] flex flex-col justify-between p-2">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

              {/* Sweeping Laser Line Animation */}
              <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-[scanLaser_2s_ease-in-out_infinite]" />

              <div className="flex justify-between items-center text-[9px] font-mono font-bold text-emerald-300 tracking-wider uppercase opacity-90 px-1">
                <span>[OPTICAL CAM-AI]</span>
                <span>QR / 1D AUTO-LOCK</span>
              </div>

              <div className="flex justify-center">
                <span className="bg-black/70 backdrop-blur-xs text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono font-medium">
                  Align Barcode or 35x15mm Tail Tag in Frame
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Camera Error or Warning State */}
        {cameraError && (
          <div className="absolute inset-0 p-4 bg-surface-container-lowest/95 backdrop-blur-xs flex flex-col items-center justify-center text-center gap-2 z-10">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">videocam_off</span>
            </div>
            <div className="text-xs font-bold text-on-surface">Camera Access Notice</div>
            <p className="text-[11px] text-outline max-w-xs leading-relaxed">{cameraError}</p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => startScanner(selectedCameraId || undefined)}
                className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-[11px] font-bold cursor-pointer"
              >
                Retry Camera
              </button>
              <label className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">upload_file</span>
                <span>Upload Barcode Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls & Demo Testing Shortcuts */}
      <div className="mt-3 flex flex-col gap-2">
        {isProcessingFile && (
          <div className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-[11px] font-bold">
            Reading barcode image...
          </div>
        )}
        {fileScanError && (
          <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-medium">
            {fileScanError}
          </div>
        )}
        {/* Last detected readout if any */}
        {lastDetected && (
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-medium">
              <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
              <span>Camera Detected: <strong className="font-mono font-bold text-on-surface">{lastDetected.text}</strong></span>
            </div>
            <span className="text-[10px] text-outline font-mono">{lastDetected.time}</span>
          </div>
        )}

        {/* Quick Simulated Detection Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-outline-variant">
          <div className="flex items-center gap-1 text-[10px] font-bold text-outline">
            <span className="material-symbols-outlined text-[14px]">touch_app</span>
            <span>Simulate Camera Scan:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleDecoded('Tray #B-14', 'SIMULATED_BARCODE')}
              className="px-2 py-0.5 rounded bg-surface-container hover:bg-primary hover:text-on-primary border border-outline-variant text-[10px] font-mono font-bold transition-colors cursor-pointer"
              title="Simulate scanning conveyor tray barcode B-14"
            >
              Tray #B-14
            </button>
            <button
              onClick={() => handleDecoded('FRM-RB-3025-GLD', 'SIMULATED_BARCODE')}
              className="px-2 py-0.5 rounded bg-surface-container hover:bg-primary hover:text-on-primary border border-outline-variant text-[10px] font-mono font-bold transition-colors cursor-pointer"
              title="Simulate scanning Ray-Ban Aviator tail tag"
            >
              FRM-RB-3025
            </button>
            <button
              onClick={() => handleDecoded('LNS-ES-CRZ-161', 'SIMULATED_BARCODE')}
              className="px-2 py-0.5 rounded bg-surface-container hover:bg-primary hover:text-on-primary border border-outline-variant text-[10px] font-mono font-bold transition-colors cursor-pointer"
              title="Simulate scanning Essilor Crizal lens barcode"
            >
              LNS-CRZ-161
            </button>
            <button
              onClick={() => handleDecoded('INS', 'SIMULATED_CIPHER')}
              className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-300 dark:border-emerald-700 text-[10px] font-mono font-bold transition-colors cursor-pointer"
              title="Simulate scanning confidential 450 BDT cost cipher"
            >
              Cipher: INS (৳450)
            </button>
            <label className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-[10px] font-bold text-on-surface cursor-pointer flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">image</span>
              <span>Scan File</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
