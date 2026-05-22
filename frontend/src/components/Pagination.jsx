import React from 'react';

const Pagination = ({ pagination, onPageChange, onLimitChange }) => {
  if (pagination.totalPages <= 0) return null;

  return (
    <div className="pagination">
      <div className="pagination-info">
        Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} bản ghi
      </div>
      <div className="pagination-controls">
        <select
          value={pagination.limit}
          onChange={(e) => onLimitChange(parseInt(e.target.value))}
          className="pagination-limit"
        >
          <option value="10">10 / trang</option>
          <option value="20">20 / trang</option>
          <option value="50">50 / trang</option>
          <option value="100">100 / trang</option>
        </select>
        <div className="pagination-buttons">
          <button onClick={() => onPageChange(1)} disabled={pagination.page === 1} className="btn btn-sm">««</button>
          <button onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page === 1} className="btn btn-sm">«</button>
          <span className="pagination-page-info">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <button onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="btn btn-sm">»</button>
          <button onClick={() => onPageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages} className="btn btn-sm">»»</button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;