# Galaxy Todo — Định hướng phát triển

Galaxy Todo không chỉ là một checklist. Sợi chỉ xuyên suốt của sản phẩm là **hành trình khám phá vũ trụ**: mỗi công việc hoàn thành là một bước tiến của "nhà thám hiểm", không phải một dòng kẻ ngang khô khan. Mọi tính năng mới nên bám theo tinh thần này thay vì là một tính năng CRUD chung chung.

## Đã có

- **Persistence qua localStorage** — dữ liệu tự động lưu sau mỗi thao tác, không mất khi tải lại trang (`db.js`).
- **Stardust & Explorer Rank** — hoàn thành task cộng Stardust theo độ ưu tiên, tích luỹ lên cấp và đổi danh xưng nhà thám hiểm (`main.js`, panel trong `index.html`).
- **Giao diện chuyên nghiệp hoá** — toast/modal xác nhận tự thiết kế thay cho `alert()`/`confirm()`, loading overlay khi khởi tạo, bảng chuyển layout dạng thẻ trên mobile, vá lỗi hiển thị HTML chưa escape.

## Sắp tới

- **PWA (cài đặt được, hoạt động offline)** — app đã 100% chạy phía client, chỉ cần thêm manifest + service worker để cài lên máy/điện thoại như app thật, không cần internet để dùng.
- **Nhắc việc qua Notification API** — cảnh báo trước khi task đến hạn (tận dụng lại logic `deadline-warning` đã có), kể cả khi tab không mở.
- **Mission Control Board** — xem task dạng Kanban 3 cột theo chủ đề bay: "Trên bệ phóng" (chưa làm) / "Đang bay" (đang làm — cần thêm trạng thái `in_progress`) / "Đã hạ cánh" (hoàn thành), kéo-thả để đổi trạng thái thay vì chỉ click vào tiêu đề.
- **Sub-task / checklist con** — task lớn có thể chia thành các "trạm dừng" nhỏ hơn, thanh tiến trình riêng cho từng task.
- **Export/Import JSON** — vì localStorage chỉ lưu theo trình duyệt/thiết bị hiện tại, cần một lối thoát để người dùng sao lưu hoặc chuyển dữ liệu sang máy khác.

## Xa hơn

- **Star System (nhóm dự án)** — gom task theo "hệ sao" (dự án/không gian làm việc) thay vì một danh sách phẳng duy nhất.
- **Huy hiệu thành tích** — ví dụ streak N ngày liên tục hoàn thành task tối thiểu 1 việc = huy hiệu "Sao Chổi", mở rộng tự nhiên từ hệ thống Stardust hiện có.
- **Light theme** — chế độ sáng cho khả năng tiếp cận, giữ nguyên bố cục nhưng đổi bộ token màu trong `style.css`.
- **Đồng bộ đa thiết bị** — cần một backend nhẹ (hiện ngoài phạm vi app thuần client), chỉ nên làm khi nhu cầu multi-device thực sự xuất hiện.

## Nguyên tắc khi thêm tính năng mới

1. Ưu tiên tính năng tính toán được từ dữ liệu sẵn có trước khi đổi schema DB (như cách Stardust được tính live từ `status`/`priority`) — giảm rủi ro migrate dữ liệu người dùng đã lưu trong `localStorage`.
2. Giữ chủ đề vũ trụ nhất quán trong tên gọi/icon, tránh thuật ngữ quản lý công việc chung chung.
3. Không có bộ test tự động — mọi thay đổi UI cần verify bằng tay qua trình duyệt trước khi coi là xong.
