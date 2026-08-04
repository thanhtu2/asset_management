import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QrScanner = ({ onScanSuccess, onScanError }) => {
  // Dùng useRef để đánh dấu Camera đã được khởi tạo hay chưa
  const scannerRef = useRef(null);

  useEffect(() => {
    // Nếu đã khởi tạo rồi thì dừng lại (Chống lỗi 2 màn hình của React 18)
    if (scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        if (onScanSuccess) onScanSuccess(decodedText);
      },
      (error) => {
        if (onScanError) onScanError(error);
      }
    );

    scannerRef.current = scanner;

    // Cleanup: Xóa camera và xóa HTML DOM khi đóng khung quét
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Lỗi tắt Camera:", e));
        scannerRef.current = null;
      }
    };
  }, [onScanSuccess, onScanError]);

  return <div id="qr-reader" style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}></div>;
};

export default QrScanner;