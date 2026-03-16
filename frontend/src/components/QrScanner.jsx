import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QrScanner = ({ onScanSuccess, onScanError }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader", // ID of the container element
      {
        fps: 10, // Frames per second to scan
        qrbox: { width: 250, height: 250 }, // Size of the scanning box
        rememberLastUsedCamera: true,
        supportedScanTypes: [
          // Html5QrcodeScanType.SCAN_TYPE_CAMERA,
          // Html5QrcodeScanType.SCAN_TYPE_FILE
        ]
      },
      false // verbose
    );

    function handleSuccess(decodedText, decodedResult) {
      // Pass the decoded text to the parent component
      onScanSuccess(decodedText, decodedResult);
    }

    function handleError(error) {
      // Errors can be frequent (e.g., QR not found), so we might not want to log them all
      // console.error(error);
      if (onScanError) {
        onScanError(error);
      }
    }

    scanner.render(handleSuccess, handleError);

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5-qrcode-scanner.", error);
      });
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
  );
};

export default QrScanner;
