# 📝 Todo List App – Phiên bản Nâng Cấp (SQL.js + Chart.js + Archive)

**Todo List App** — ứng dụng quản lý công việc chạy hoàn toàn trên trình duyệt. Phiên bản này sử dụng **SQL.js** (SQLite chạy bằng WebAssembly) nhằm giả lập cơ sở dữ liệu SQLite ngay trong browser và **Chart.js** để hiển thị thống kê trực quan. Ứng dụng hỗ trợ CRUD, đánh dấu hoàn thành, cảnh báo deadline, lưu trữ (archive), tìm kiếm real-time và biểu đồ tiến độ.

**🔗 Demo:** https://namhaiit2hust.github.io/Todo-List-App/  
**📦 Source:** https://github.com/NamHaiIT2HUST/Todo-List-App

---

## 🚀 Tính năng chính

### ✔️ Quản lý công việc (CRUD)
- Thêm công việc: **Tiêu đề**, **Mô tả**, **Ưu tiên**, **Thời gian bắt đầu**, **Thời gian kết thúc**
- Chỉnh sửa công việc trực tiếp
- Xóa từng công việc hoặc xóa toàn bộ công việc chưa archive

### 🎯 Ưu tiên (Priority)
- **High** – Đỏ  
- **Medium** – Vàng  
- **Low** – Xanh  

### 🕒 Trạng thái & deadline
- Click vào **tiêu đề** để đánh dấu hoàn thành / chưa hoàn thành
- Hộp thoại xác nhận trước khi chuyển trạng thái
- Công việc sắp đến hạn (< 1 ngày) và chưa hoàn thành → tô vàng (deadline-warning)

### 📦 Lưu trữ (Archive)
- Công việc đã hoàn thành sẽ hiển thị nút **Archive**
- Có thể **Restore** hoặc **Delete** trong trang Archive
- Danh sách được chia làm:
  - **Current Tasks**
  - **Archived Tasks**

### 🔍 Tìm kiếm
- Tìm kiếm theo **Tiêu đề** (real-time)

### 📊 Thống kê (Chart.js)
- **Pie chart:** Tỷ lệ công việc đã hoàn thành vs chưa hoàn thành  
- **Bar chart:** Thống kê số công việc hoàn thành trong **7 ngày gần nhất**  

### 🎨 Giao diện & trải nghiệm
- Dùng **Bootstrap 5**
- Avatar trợ lý hai bên màn hình + hiệu ứng vẫy tay
- Bong bóng thoại hướng dẫn sử dụng
- Thay nền **desktop vs mobile**
- Ẩn helper avatar tự động trên màn hình nhỏ

---

## 🛠️ Công nghệ sử dụng
- **HTML5**
- **CSS3 + Bootstrap 5**
- **JavaScript ES6 Modules**
- **SQL.js (SQLite trong trình duyệt)**
- **Chart.js**
- **Boxicons**

---

## 📁 Cấu trúc dự án

```
Todo-List-App/
├── index.html
├── style.css
├── main.js
├── db.js
└── image/
    ├── laptop_background.jpg
    ├── mobile_background.jpg
    ├── my_profile_avatar.png
    └── my_profile_avatar_2.jpg
```

---

## ▶️ Cách chạy

### (1) Mở trực tiếp
1. Clone project:
```bash
git clone https://github.com/NamHaiIT2HUST/Todo-List-App.git
```
2. Mở file:
```
index.html
```

### (2) Chạy bằng local server (khuyến nghị)
```bash
npm install -g http-server
http-server .
```
Hoặc dùng **Live Server (VSCode)**.

Truy cập:
```
http://localhost:8080
```

---

## 💾 Lưu trữ dữ liệu (SQL.js)
SQL.js chạy toàn bộ database SQLite **trong RAM**, do đó:

- ❗ **Dữ liệu sẽ mất sau khi reload hoặc đóng tab**
- ✔️ Không phụ thuộc LocalStorage
- ✔️ Mọi query chạy giống SQLite thật

---

## 📌 Roadmap tương lai
- [ ] Lưu database vào IndexedDB  
- [ ] Bộ lọc nâng cao (priority / status / thời gian)  
- [ ] Xuất báo cáo PDF  
- [ ] Backend API để đồng bộ đa thiết bị  
- [ ] Dark mode  

---

## 🤝 Đóng góp
PRs luôn được hoan nghênh.  
Nếu có lỗi hoặc cần tính năng mới, hãy mở Issue trong repo.

---

## 📄 License
Dự án thuộc sở hữu của bạn.  

---

## ❤️ Lời cảm ơn
Cảm ơn bạn đã sử dụng **Todo List App**!  
Chúc bạn một ngày thật vui vẻ & hiệu quả! 🌱💪
