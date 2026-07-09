import React, { useEffect, useRef } from 'react';

const UserGuidePage = () => {
  const mainContentRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const sidebarLinks = sidebarRef.current?.querySelectorAll('a');
    const contentSections = mainContentRef.current?.querySelectorAll('section');

    if (!sidebarLinks || !contentSections || sidebarLinks.length === 0 || contentSections.length === 0) {
      return;
    }

    const changeActiveLink = () => {
      let currentIndex = -1;
      contentSections.forEach((section, index) => {
        if (window.scrollY >= section.offsetTop - 100) {
          currentIndex = index;
        }
      });

      sidebarLinks.forEach((link, index) => {
        if (index === currentIndex) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    };

    const handleLinkClick = (e) => {
      e.preventDefault();
      const targetId = e.currentTarget.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 20,
          behavior: 'smooth',
        });
      }
    };

    // Initial check
    changeActiveLink();

    // Add event listeners
    window.addEventListener('scroll', changeActiveLink);
    sidebarLinks.forEach(link => {
      link.addEventListener('click', handleLinkClick);
    });

    // Cleanup function
    return () => {
      window.removeEventListener('scroll', changeActiveLink);
      sidebarLinks.forEach(link => {
        link.removeEventListener('click', handleLinkClick);
      });
    };
  }, []);

  return (
    <>
      <style>{`
        .user-guide-container {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            background-color: var(--color-bg, #f8fafc);
            color: var(--color-text, #334155);
            line-height: 1.6;
            display: flex;
        }
        .user-guide-sidebar {
            width: 260px;
            background-color: var(--color-bg-light, #ffffff);
            border-right: 1px solid var(--color-border, #e2e8f0);
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            overflow-y: auto;
            padding: 20px;
            box-sizing: border-box;
            z-index: 1000;
        }
        .user-guide-sidebar h2 {
            font-size: 16px;
            color: var(--color-primary, #2563eb);
            margin-top: 0;
            border-bottom: 2px solid var(--color-primary, #2563eb);
            padding-bottom: 10px;
        }
        .user-guide-sidebar ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .user-guide-sidebar li a {
            display: block;
            padding: 10px 15px;
            color: var(--color-text-secondary, #64748b);
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        .user-guide-sidebar li a:hover, .user-guide-sidebar li a.active {
            background-color: var(--color-primary-light, #eff6ff);
            color: var(--color-primary, #2563eb);
        }
        .user-guide-sidebar .group-title {
            font-size: 11px;
            font-weight: 600;
            color: var(--color-text-secondary, #64748b);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 15px 15px 5px;
            margin-top: 10px;
        }
        .user-guide-main-content {
            margin-left: 260px;
            padding: 30px 40px;
            width: calc(100% - 260px);
        }
        .user-guide-main-content section {
            margin-bottom: 40px;
            padding-top: 20px;
        }
        .user-guide-main-content h1 {
            font-size: 28px;
            border-bottom: 1px solid var(--color-border, #e2e8f0);
            padding-bottom: 15px;
            margin-top: 0;
        }
        .user-guide-main-content h2 {
            font-size: 22px;
            color: var(--color-primary, #2563eb);
            margin-top: 30px;
            margin-bottom: 15px;
        }
        .user-guide-main-content p, .user-guide-main-content li {
            font-size: 15px;
            color: #475569;
        }
        .user-guide-main-content code {
            background-color: #eef2ff;
            color: #4338ca;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace;
            font-size: 0.9em;
        }
        .user-guide-main-content .card {
            background-color: var(--color-bg-light, #ffffff);
            border: 1px solid var(--color-border, #e2e8f0);
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        .user-guide-main-content .note {
            background-color: var(--color-primary-light, #eff6ff);
            border-left: 4px solid var(--color-primary, #2563eb);
            padding: 15px;
            border-radius: 0 4px 4px 0;
            margin: 20px 0;
        }
        .user-guide-main-content .note p { margin: 0; }
        @media (max-width: 768px) {
            .user-guide-container { display: block; }
            .user-guide-sidebar {
                position: static;
                width: 100%;
                height: auto;
                border-right: none;
                border-bottom: 1px solid var(--color-border, #e2e8f0);
            }
            .user-guide-main-content {
                margin-left: 0;
                width: 100%;
                padding: 20px;
                box-sizing: border-box;
            }
        }
      `}</style>
      <div className="user-guide-container">
        <nav className="user-guide-sidebar" ref={sidebarRef}>
          <h2>📖 Hướng Dẫn Sử Dụng</h2>
          <ul>
            <li className="group-title">Bắt đầu</li>
            <li><a href="#dang-nhap">Đăng nhập & Giao diện</a></li>
            
            <li className="group-title">Chức năng chính</li>
            <li><a href="#dashboard">1. Dashboard</a></li>
            <li><a href="#quan-ly-tai-san">2. Quản lý Tài sản</a></li>
            <li><a href="#quan-ly-xe">3. Quản lý Đăng ký xe</a></li>
            <li><a href="#bao-tri">4. Bảo trì</a></li>
            <li><a href="#kiem-ke">5. Kiểm kê</a></li>
            <li><a href="#de-xuat-mua-sam">6. Đề xuất Mua sắm</a></li>
            <li><a href="#tra-cuu-qr">7. Tra cứu bằng QR Code</a></li>

            <li className="group-title">Quản lý Danh mục</li>
            <li><a href="#danh-muc">8. Danh mục Tài sản</a></li>
            <li><a href="#vi-tri">9. Vị trí</a></li>
            <li><a href="#nha-cung-cap">10. Nhà cung cấp</a></li>
            <li><a href="#phong-ban">11. Phòng ban</a></li>

            <li className="group-title">Quản trị Hệ thống</li>
            <li><a href="#nguoi-dung">12. Quản lý Người dùng</a></li>
            <li><a href="#phan-quyen">13. Phân quyền (RBAC)</a></li>
            <li><a href="#audit-log">14. Lịch sử Hệ thống</a></li>
          </ul>
        </nav>

        <main className="user-guide-main-content" ref={mainContentRef}>
          <section id="dang-nhap">
              <h1>Chào mừng đến với Hệ thống Quản lý Tài sản</h1>
              <p>Tài liệu này sẽ hướng dẫn bạn qua các tính năng chính của hệ thống, giúp bạn quản lý, theo dõi và bảo trì tài sản của công ty một cách hiệu quả.</p>
              
              <h2>Đăng nhập</h2>
              <div className="card">
                  <p>Để bắt đầu, bạn cần truy cập vào địa chỉ web của hệ thống và sử dụng tài khoản đã được cấp để đăng nhập.</p>
                  <ol>
                      <li>Mở trình duyệt web và truy cập vào đường dẫn của ứng dụng.</li>
                      <li>Nhập <strong>Tên đăng nhập</strong> và <strong>Mật khẩu</strong> của bạn.</li>
                      <li>Nhấn nút <strong>"Đăng nhập"</strong>.</li>
                  </ol>
                  <p>Nếu đăng nhập thành công, bạn sẽ được chuyển đến trang Dashboard.</p>
              </div>

              <h2>Giao diện chính</h2>
              <div className="card">
                  <p>Giao diện chính bao gồm 2 phần:</p>
                  <ul>
                      <li><strong>Thanh điều hướng (Sidebar) bên trái:</strong> Chứa các liên kết đến tất cả các chức năng chính của hệ thống. Các mục bạn thấy sẽ phụ thuộc vào quyền hạn được cấp cho tài khoản của bạn.</li>
                      <li><strong>Vùng nội dung chính ở giữa:</strong> Hiển thị chi tiết của chức năng bạn đã chọn.</li>
                  </ul>
                  <p>Ở góc dưới bên trái, bạn sẽ thấy thông tin tài khoản của mình. Bạn có thể nhấn vào tên để đến trang <strong>Hồ sơ cá nhân</strong> hoặc nhấn nút 🚪 để đăng xuất.</p>
              </div>
          </section>

          <section id="dashboard">
              <h1>1. Dashboard - Bảng điều khiển</h1>
              <p>Đây là màn hình đầu tiên sau khi đăng nhập, cung cấp cái nhìn tổng quan về tình hình tài sản trong công ty.</p>
              <div className="card">
                  <ul>
                      <li><strong>Các thẻ thống kê nhanh:</strong> Hiển thị các con số quan trọng như tổng số tài sản, tổng giá trị, số lượng tài sản theo từng trạng thái (Chờ cấp, Đang sử dụng, Cần sửa chữa, Hỏng, Đã thanh lý).</li>
                      <li><strong>Biểu đồ tròn:</strong> Trực quan hóa tỷ lệ tài sản theo từng danh mục.</li>
                      <li><strong>Biểu đồ cột:</strong> Cho thấy sự phân bổ tài sản giữa các phòng ban.</li>
                      <li><strong>Bảo trì sắp tới:</strong> Danh sách các tài sản sắp đến hạn bảo trì, giúp bạn lên kế hoạch chủ động.</li>
                  </ul>
              </div>
          </section>

          <section id="quan-ly-tai-san">
              <h1>2. Quản lý Tài sản</h1>
              <p>Đây là chức năng cốt lõi, nơi bạn có thể xem, thêm, sửa, xóa và thực hiện các thao tác khác liên quan đến tài sản.</p>
              
              <h2>Xem và Tìm kiếm Tài sản</h2>
              <div className="card">
                  <ul>
                      <li>Sử dụng ô <strong>"Tìm kiếm"</strong> để nhanh chóng tìm tài sản theo tên, mã tài sản, hoặc người sử dụng.</li>
                      <li>Sử dụng các bộ lọc (dropdown) để lọc danh sách theo phòng ban, danh mục, vị trí hoặc trạng thái.</li>
                      <li>Nhấn nút <strong>"Xem"</strong> ở mỗi dòng để xem thông tin chi tiết, lịch sử sử dụng và lịch sử bảo trì của tài sản.</li>
                  </ul>
              </div>

              <h2>Thêm và Sửa Tài sản</h2>
              <div className="card">
                  <p>Để thêm tài sản mới, nhấn nút <strong>"+ Thêm tài sản"</strong>. Để sửa, nhấn nút <strong>"Sửa"</strong> ở dòng tài sản tương ứng.</p>
                  <p>Form nhập liệu sẽ hiện ra, bạn cần điền các thông tin cần thiết. Các trường có dấu <code>*</code> là bắt buộc.</p>
                  <div className="note">
                      <p><strong>Lưu ý:</strong> Khi tạo mới, <strong>Mã tài sản</strong> sẽ được hệ thống tự động sinh ra dựa trên quy tắc đã định sẵn để đảm bảo tính duy nhất.</p>
                  </div>
              </div>

              <h2>In và Quản lý QR Code</h2>
              <div className="card">
                  <p>Hệ thống hỗ trợ in tem nhãn QR Code để dán lên tài sản, giúp việc tra cứu và kiểm kê trở nên dễ dàng.</p>
                  <ul>
                      <li><strong>In đơn lẻ:</strong> Tại mỗi dòng tài sản, nhấn nút <strong>"QR"</strong>. Một cửa sổ sẽ hiện ra hiển thị mã QR, bạn có thể nhấn <strong>"In nhãn"</strong> để in.</li>
                      <li><strong>In hàng loạt:</strong> Tích vào các ô vuông ở đầu mỗi dòng để chọn nhiều tài sản. Một thanh công cụ sẽ hiện ra ở đầu bảng, nhấn vào <strong>"In QR"</strong> để chuẩn bị in hàng loạt.</li>
                  </ul>
              </div>

              <h2>Import và Export Excel</h2>
               <div className="card">
                  <p>Chức năng này giúp bạn quản lý dữ liệu tài sản với số lượng lớn một cách nhanh chóng.</p>
                  <ul>
                      <li><strong>Export Excel:</strong> Nhấn nút <strong>"Xuất Excel"</strong> để tải về file danh sách toàn bộ tài sản hiện có (đã áp dụng bộ lọc).</li>
                      <li><strong>Import Excel:</strong>
                          <ol>
                              <li>Nhấn <strong>"Import Excel"</strong>, sau đó tải file mẫu về.</li>
                              <li>Điền thông tin tài sản mới vào file mẫu. Lưu ý điền đúng các mã (Mã danh mục, Mã vị trí...).</li>
                              <li>Tải file đã điền dữ liệu lên hệ thống để thêm mới hàng loạt.</li>
                          </ol>
                      </li>
                  </ul>
              </div>
          </section>

          <section id="quan-ly-xe">
              <h1>3. Quản lý Đăng ký xe</h1>
              <p>Phân hệ này giúp quản lý việc đăng ký sử dụng xe và theo dõi lịch trình của các xe trong công ty.</p>
              <div className="card">
                  <ul>
                      <li><strong>Chế độ xem:</strong> Bạn có thể chuyển đổi giữa chế độ xem <strong>"Danh sách"</strong> (hiển thị tất cả các yêu cầu) và <strong>"Lịch tuần"</strong> (hiển thị lịch trình trực quan theo từng ngày trong tuần).</li>
                      <li><strong>Tạo yêu cầu:</strong> Nhấn nút <strong>"+ Thêm Đăng ký xe"</strong>, điền đầy đủ thông tin về điểm đi, điểm đến, thời gian, thành phần tham gia và chọn xe (nếu có).</li>
                      <li><strong>Điều phối:</strong> Người có quyền điều phối sẽ thấy toàn bộ các yêu cầu và có thể gán xe, tài xế cho các chuyến đi chưa được phân công.</li>
                  </ul>
              </div>
          </section>

          <section id="bao-tri">
              <h1>4. Bảo trì</h1>
              <p>Theo dõi và quản lý các hoạt động bảo trì, sửa chữa cho tài sản.</p>
              <div className="card">
                  <ul>
                      <li><strong>Tạo phiếu bảo trì:</strong> Nhấn <strong>"+ Thêm bảo trì"</strong> để tạo một phiếu bảo trì mới (định kỳ, sửa chữa...).</li>
                      <li><strong>Tự động tạo phiếu:</strong> Khi một tài sản được chuyển sang trạng thái "Cần sửa chữa" hoặc "Hỏng", hệ thống sẽ tự động tạo một phiếu bảo trì khẩn cấp.</li>
                      <li><strong>Hoàn thành sửa chữa:</strong> Sau khi sửa chữa xong, nhấn nút <strong>"✓ Hoàn thành"</strong>. Thao tác này sẽ đồng thời cập nhật trạng thái của tài sản về "Đang sử dụng".</li>
                  </ul>
              </div>
          </section>

          <section id="kiem-ke">
              <h1>5. Kiểm kê</h1>
              <p>Thực hiện các phiên kiểm kê tài sản định kỳ để đảm bảo số liệu trên hệ thống khớp với thực tế.</p>
              <div className="card">
                  <h2>Quy trình kiểm kê:</h2>
                  <ol>
                      <li><strong>Tạo phiên kiểm kê:</strong> Nhấn <strong>"+ Tạo phiên kiểm kê"</strong>, đặt tên và chọn loại kiểm kê (toàn bộ hoặc theo phòng ban).</li>
                      <li><strong>Thêm tài sản vào phiên:</strong> Sau khi tạo, vào chi tiết phiên và thêm các tài sản cần kiểm kê.</li>
                      <li><strong>Thực hiện kiểm kê:</strong>
                          <ul>
                              <li><strong>Quét mã QR:</strong> Dùng camera của điện thoại hoặc máy quét mã vạch, nhấn nút <strong>"Bắt đầu quét"</strong> và quét tem trên tài sản. Hệ thống sẽ tự động ghi nhận tài sản là "Tìm thấy".</li>
                              <li><strong>Ghi nhận thủ công:</strong> Với các tài sản không có mã, bạn có thể tìm trong danh sách và nhấn các nút ✓ (Tìm thấy), ✗ (Thiếu), hoặc ! (Hỏng).</li>
                          </ul>
                      </li>
                      <li><strong>Xử lý tài sản hỏng:</strong> Đối với các tài sản được ghi nhận là "Hỏng", bạn có thể tạo phiếu sửa chữa hoặc đề xuất thanh lý ngay trong giao diện kiểm kê.</li>
                      <li><strong>Hoàn thành phiên:</strong> Sau khi kiểm kê xong, nhấn <strong>"✓ Hoàn thành phiên"</strong>. Hệ thống sẽ chốt số liệu và tạo báo cáo chênh lệch.</li>
                  </ol>
              </div>
          </section>

          <section id="de-xuat-mua-sam">
              <h1>6. Đề xuất Mua sắm</h1>
              <p>Tạo và theo dõi quy trình phê duyệt các đề xuất mua sắm tài sản, trang thiết bị mới.</p>
              <div className="card">
                  <h2>Luồng phê duyệt:</h2>
                  <p><code>Soạn phiếu</code> → <code>Lãnh đạo phòng duyệt</code> → <code>Giám đốc duyệt</code> → <code>Hoàn thành</code></p>
                  <ul>
                      <li><strong>Tạo phiếu:</strong> Nhấn <strong>"+ Tạo mới"</strong>, điền thông tin chung, thêm các vật tư/tài sản cần mua vào danh sách, và đính kèm file báo giá (nếu có).</li>
                      <li><strong>Gửi duyệt:</strong> Sau khi soạn xong, nhấn <strong>"Gửi duyệt"</strong> để chuyển phiếu đến cấp trên.</li>
                      <li><strong>Theo dõi:</strong> Bạn có thể vào xem chi tiết phiếu để theo dõi tiến trình phê duyệt và xem các ý kiến (comment) từ người duyệt.</li>
                  </ul>
              </div>
          </section>

          <section id="tra-cuu-qr">
              <h1>7. Tra cứu bằng QR Code (Public)</h1>
              <p>Đây là một tính năng đặc biệt cho phép bất kỳ ai (kể cả người không có tài khoản) cũng có thể tra cứu thông tin tài sản.</p>
              <div className="card">
                  <ul>
                      <li>Sử dụng camera trên điện thoại để quét mã QR được dán trên tài sản.</li>
                      <li>Trình duyệt sẽ tự động mở ra một trang hiển thị các thông tin cơ bản của tài sản như tên, mã, phòng ban, người sử dụng, và lịch sử bảo trì.</li>
                      <li>Nếu thiết bị bị hỏng, người dùng có thể nhấn nút <strong>"Báo tình trạng thiết bị"</strong> và chọn <strong>"Báo hỏng"</strong>. Hệ thống sẽ tự động tạo một thông báo cảnh báo đến người quản lý.</li>
                  </ul>
              </div>
          </section>

          <section id="danh-muc">
              <h1>8. Quản lý Danh mục Tài sản</h1>
              <p>Phân loại tài sản vào các nhóm khác nhau (VD: Máy tính, Thiết bị văn phòng, Đồ đạc...).</p>
              <div className="card">
                  <p>Tại đây bạn có thể thêm, sửa, xóa các danh mục. Một thông tin quan trọng ở đây là <strong>Tỷ lệ khấu hao (%)</strong>, hệ thống sẽ dựa vào đây để tự động tính toán giá trị còn lại của tài sản theo thời gian.</p>
              </div>
          </section>

          <section id="vi-tri">
              <h1>9. Quản lý Vị trí</h1>
              <p>Quản lý các địa điểm lưu trữ tài sản như kho, văn phòng, chi nhánh.</p>
          </section>

          <section id="nha-cung-cap">
              <h1>10. Quản lý Nhà cung cấp</h1>
              <p>Lưu trữ thông tin liên hệ của các đơn vị cung cấp tài sản, thiết bị.</p>
          </section>

          <section id="phong-ban">
              <h1>11. Quản lý Phòng ban</h1>
              <p>Quản lý cơ cấu tổ chức các phòng ban trong công ty.</p>
          </section>

          <section id="nguoi-dung">
              <h1>12. Quản lý Người dùng</h1>
              <p>Chức năng dành cho Quản trị viên để quản lý tài khoản người dùng trong hệ thống.</p>
              <div className="card">
                  <ul>
                      <li><strong>Thêm/Sửa người dùng:</strong> Tạo tài khoản mới hoặc cập nhật thông tin (họ tên, phòng ban, vai trò) cho người dùng hiện tại.</li>
                      <li><strong>Đặt lại mật khẩu:</strong> Quản trị viên có thể chủ động đặt lại mật khẩu cho bất kỳ người dùng nào.</li>
                      <li><strong>Khóa/Mở tài khoản:</strong> Thay đổi trạng thái "Hoạt động" của người dùng để tạm thời vô hiệu hóa hoặc kích hoạt lại tài khoản.</li>
                  </ul>
              </div>
          </section>

          <section id="phan-quyen">
              <h1>13. Phân quyền (RBAC)</h1>
              <p>Chức năng nâng cao cho Quản trị viên, cho phép cấu hình chi tiết quyền hạn cho từng vai trò.</p>
              <div className="card">
                  <ul>
                      <li><strong>Vai trò (Role):</strong> Là một nhóm người dùng có chức năng tương tự (VD: Kế toán, Nhân viên, Trưởng phòng).</li>
                      <li><strong>Quyền (Permission):</strong> Là một hành động cụ thể (VD: Xóa tài sản, Phê duyệt đề xuất).</li>
                      <li><strong>Cách sử dụng:</strong>
                          <ol>
                              <li>Chọn một vai trò từ danh sách.</li>
                              <li>Tích hoặc bỏ tích vào các quyền hạn bạn muốn gán/thu hồi cho vai trò đó.</li>
                              <li>Nhấn <strong>"Lưu cấu hình"</strong>.</li>
                          </ol>
                      </li>
                  </ul>
                  <div className="note">
                      <p><strong>Lưu ý:</strong> Sau khi quyền hạn được thay đổi, người dùng thuộc vai trò đó cần <strong>Đăng xuất</strong> và <strong>Đăng nhập lại</strong> để thay đổi có hiệu lực.</p>
                  </div>
              </div>
          </section>

          <section id="audit-log">
              <h1>14. Lịch sử Hệ thống (Audit Log)</h1>
              <p>Đây là "camera an ninh" của hệ thống, ghi lại mọi hành động quan trọng.</p>
              <div className="card">
                  <p>Trang này ghi lại chi tiết: <strong>Ai</strong> đã làm gì, vào <strong>lúc nào</strong>, trên <strong>đối tượng nào</strong>, và từ <strong>địa chỉ IP nào</strong>. Đặc biệt, với các hành động sửa đổi, hệ thống sẽ ghi nhận chính xác trường dữ liệu nào đã thay đổi từ giá trị cũ sang giá trị mới.</p>
                  <p>Dữ liệu này là bất biến, không thể sửa hoặc xóa, đảm bảo tính minh bạch và trách nhiệm.</p>
              </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default UserGuidePage;

