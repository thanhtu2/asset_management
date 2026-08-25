export const getSystemStatus = async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  if (!isAdmin) return res.status(200).json({ online: true });

  res.status(200).json({
    online: true,
    lastBackup: null, // TODO: nối vào bảng/log backup thật khi có
    uptime: `${process.uptime().toFixed(0)}s`,
  });
};