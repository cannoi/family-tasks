const http = require('http');

const PORT = process.env.PORT || 8080;

console.log('Chạy kiểm tra sức khỏe ứng dụng...');

setTimeout(() => {
  http.get(`http://127.0.0.1:${PORT}/health`, (res) => {
    if (res.statusCode === 200) {
      console.log('Kiểm tra sức khỏe thành công: HTTP 200');
      process.exit(0);
    } else {
      console.error(`Kiểm tra thất bại với mã trạng thái: ${res.statusCode}`);
      process.exit(1);
    }
  }).on('error', (err) => {
    console.error('Không thể kết nối đến server:', err.message);
    process.exit(1);
  });
}, 1000);
