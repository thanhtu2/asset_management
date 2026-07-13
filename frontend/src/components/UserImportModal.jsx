import { useState, useRef } from 'react';
import { usersAPI } from '../api';

const UserImportModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null); // null | { success, failed, errors, message }
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const allowed = /\.(xlsx|xls|csv)$/i;
    if (!allowed.test(selectedFile.name)) {
      alert('Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv)');
      return;
    }
    setFile(selectedFile);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await usersAPI.importUsers(formData);
      setResult(response.data);
      if (response.data.success > 0) onSuccess();
    } catch (err) {
      setResult({
        success: 0,
        failed: 0,
        errors: [],
        message: err.response?.data?.message || 'Đã xảy ra lỗi khi import'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await usersAPI.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_import_nguoi_dung.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Lỗi tải file mẫu:", error);
      alert("Không thể tải file mẫu. Vui lòng thử lại.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2>Import Người dùng từ Excel / CSV</h2>
          <button onClick={onClose} className="btn btn-sm btn-outline">&times;</button>
        </div>

        <div className="modal-body">
          {/* Step 1: Download template */}
          <div className="import-step">
            <div className="import-step-header">
              <span className="import-step-number">1</span>
              <span>Tải file mẫu</span>
            </div>
            <p className="import-hint">
              Sử dụng file mẫu để nhập đúng định dạng. Các cột bắt buộc: <strong>username</strong>, <strong>password</strong>, <strong>fullName</strong>.
            </p>
            <button onClick={handleDownloadTemplate} className="btn btn-outline btn-sm">
              ⬇ Tải file mẫu (.xlsx)
            </button>
          </div>

          <div className="import-divider" />

          {/* Step 2: Upload file */}
          <div className="import-step">
            <div className="import-step-header">
              <span className="import-step-number">2</span>
              <span>Chọn file để import</span>
            </div>

            {!result && (
              <div
                className={`import-dropzone${dragging ? ' import-dropzone--active' : ''}${file ? ' import-dropzone--has-file' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
                {file ? (
                  <div className="import-file-info">
                    <span className="import-file-icon">📄</span>
                    <span className="import-file-name">{file.name}</span>
                    <span className="import-file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <div className="import-dropzone-placeholder">
                    <span style={{ fontSize: '2rem' }}>📂</span>
                    <p>Kéo thả file vào đây hoặc <strong>nhấp để chọn file</strong></p>
                    <p className="import-hint">Hỗ trợ: .xlsx, .xls, .csv (tối đa 5MB)</p>
                  </div>
                )}
              </div>
            )}

            {/* Result display */}
            {result && (
              <div className="import-result">
                <div className={`import-result-summary${result.failed === 0 ? ' import-result-summary--success' : ' import-result-summary--partial'}`}>
                  <span>✅ Thành công: <strong>{result.success}</strong></span>
                  <span>❌ Thất bại: <strong>{result.failed}</strong></span>
                </div>
                <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>{result.message}</p>

                {result.errors && result.errors.length > 0 && (
                  <div className="import-errors">
                    <p><strong>Chi tiết lỗi:</strong></p>
                    <div className="import-errors-list">
                      {result.errors.map((err, idx) => (
                        <div key={idx} className="import-error-item">
                          <span className="import-error-row">Dòng {err.row}</span>
                          {err.username && <span className="import-error-code">{err.username}</span>}
                          <span className="import-error-msg">{err.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {result ? (
            <>
              <button onClick={handleReset} className="btn btn-outline">Import thêm</button>
              <button onClick={onClose} className="btn btn-primary">Đóng</button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="btn btn-outline" disabled={importing}>Hủy</button>
              {file && (
                <button
                  onClick={handleImport}
                  className="btn btn-primary"
                  disabled={importing}
                >
                  {importing ? 'Đang import...' : '⬆ Bắt đầu import'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserImportModal;
