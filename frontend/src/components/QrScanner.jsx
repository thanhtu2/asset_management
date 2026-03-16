import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QrScanner = ({ onScanSuccess, onScanError }) => {
  const [scannerId] = useState(() => `qr-reader-${Date.now()}`);
  const html5QrCodeRef = useRef(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanErrorRef = useRef(onScanError);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onScanErrorRef.current = onScanError;
  }, [onScanSuccess, onScanError]);

  useEffect(() => {
    const startScanner = async () => {
      try {
        html5QrCodeRef.current = new Html5Qrcode(scannerId);
        
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText, decodedResult) => {
            onScanSuccessRef.current(decodedText, decodedResult);
          },
          (errorMessage) => {
            if (onScanErrorRef.current) {
              onScanErrorRef.current(errorMessage);
            }
          }
        );
      } catch (err) {
        console.error("Error starting scanner:", err);
        if (onScanErrorRef.current) {
          onScanErrorRef.current(err);
        }
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => {
          console.error("Error stopping scanner:", err);
        });
      }
    };
  }, [scannerId]);

  return (
    <div id={scannerId} style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
  );
};

export default QrScanner;
