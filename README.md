Todo List App (Ứng dụng Quản lý Công việc)

Một ứng dụng Quản lý Công việc (Todo List) được xây dựng bằng HTML, CSS và JavaScript thuần, cho phép người dùng theo dõi, quản lý và thống kê các công việc hằng ngày.

Ứng dụng sử dụng LocalStorage để lưu trữ dữ liệu trực tiếp trên trình duyệt, đảm bảo công việc không bị mất khi tải lại trang.

Tính năng chính

Quản lý Công việc (CRUD):

Thêm công việc mới với Tiêu đề, Mô tả.

Sửa (Update) nội dung của công việc.

Xoá (Delete) từng công việc hoặc xoá tất cả.

Quản lý Thời gian:

Đặt Thời gian Bắt đầu (Start Time) và Thời gian Kết thúc (End Time) cho mỗi công việc.

Theo dõi Trạng thái:

Đánh dấu công việc là "Hoàn thành" (màu xanh lá) hoặc "Chưa hoàn thành" (màu đỏ).

Hiển thị hộp thoại xác nhận ("Bạn chắc chắn đã hoàn thành...?") khi thay đổi trạng thái.

Thống kê Trực quan:

Tích hợp Chart.js để vẽ biểu đồ tròn (Pie Chart) thời gian thực.

Biểu đồ tự động cập nhật, hiển thị tỷ lệ công việc đã hoàn thành so với chưa hoàn thành.

Lưu trữ Dữ liệu:

Sử dụng LocalStorage của trình duyệt để lưu trữ toàn bộ danh sách công việc.

Giao diện Đáp ứng (Responsive):

Tự động thay đổi ảnh nền (background image) khác nhau cho thiết bị desktop và mobile.

Bảng (table) danh sách công việc tự động cuộn ngang trên màn hình điện thoại để tránh vỡ giao diện.

Công nghệ sử dụng

HTML5

CSS3 (với Bootstrap 5 để tạo giao diện nhanh)

JavaScript (ES6+) (Xử lý toàn bộ logic)

Chart.js (Thư viện vẽ biểu đồ)

LocalStorage (Lưu trữ phía client)

Cách chạy (How to run)

Clone repository này về máy của bạn:

git clone [https://github.com/NamHaiIT2HUST/Todo-List-App.git](https://github.com/NamHaiIT2HUST/Todo-List-App.git)


Đi tới thư mục project:

cd Todo-List-App


Mở file index.html bằng trình duyệt của bạn để bắt đầu sử dụng.
