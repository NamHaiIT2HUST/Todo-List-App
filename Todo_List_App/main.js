import * as db from './db.js';

// DOM Elements
const todoForm = document.getElementById("todoForm");
const titleEl = document.getElementById("title");
const descEl = document.getElementById("description");
const priorityEl = document.getElementById("priority");
const startEl = document.getElementById("startTime");
const endEl = document.getElementById("endTime");

const btnReset = document.getElementById("reset-btn");
const btnAdd = document.getElementById("add-btn");
const btnRemoveAll = document.getElementById("remove-all-btn");

const tbody = document.getElementById("tbody");
const archiveTbody = document.getElementById("archiveTbody");
const searchInput = document.getElementById("searchInput");

// Các phần hiển thị phụ
const toggleArchiveBtn = document.getElementById("toggleArchiveBtn");
const archiveSection = document.getElementById("archiveSection");
const toggleStatsBtn = document.getElementById("toggleStatsBtn");
const statisticsSection = document.getElementById("statisticsSection");

const appLoadingOverlay = document.getElementById("appLoadingOverlay");
const toastContainer = document.getElementById("toastContainer");

// Biến toàn cục
let overviewChartInstance = null;
let dailyChartInstance = null;
let todoEditingId = null; // Lưu ID đang sửa (null nếu là thêm mới)

// --- MAIN LOGIC ---

// 1. Khởi chạy App
async function main() {
    try {
        await db.initDatabase();
        await renderAll();
    } catch (err) {
        console.error("Lỗi khi khởi động app:", err);
        showToast("Lỗi khởi tạo Database! Hãy kiểm tra console.", "error");
    } finally {
        hideLoadingOverlay();
    }
}
main();

function hideLoadingOverlay() {
    if (!appLoadingOverlay) return;
    appLoadingOverlay.classList.add('is-hidden');
    setTimeout(() => appLoadingOverlay.remove(), 400);
}

// 2. Xử lý Submit Form (Thêm hoặc Sửa)
todoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const todoData = {
        title: titleEl.value.trim(),
        description: descEl.value.trim(),
        priority: priorityEl.value,
        startTime: startEl.value, // Giá trị từ input datetime-local
        endTime: endEl.value,
    };

    clearFieldError(titleEl);
    clearFieldError(endEl);

    // Validation
    if (!todoData.title) {
        showToast("Vui lòng nhập tiêu đề công việc!", "error");
        markFieldError(titleEl);
        titleEl.focus();
        return;
    }

    if (todoData.startTime && todoData.endTime) {
        if (new Date(todoData.endTime) <= new Date(todoData.startTime)) {
            showToast("Thời gian kết thúc phải SAU thời gian bắt đầu!", "error");
            markFieldError(endEl);
            return;
        }
    }

    try {
        if (todoEditingId) {
            // Logic Update
            db.updateTask(todoEditingId, todoData);
            showToast("Cập nhật thành công!", "success");
        } else {
            // Logic Add New
            db.addTask(todoData);
            showToast("Đã thêm công việc mới!", "success");
        }

        resetForm(); // Reset form sau khi lưu
        await renderAll();

    } catch (err) {
        console.error("Lỗi khi submit:", err);
        showToast("Có lỗi xảy ra, vui lòng thử lại.", "error");
    }
});

// Xoá trạng thái lỗi khi người dùng gõ lại
titleEl.addEventListener("input", () => clearFieldError(titleEl));
endEl.addEventListener("input", () => clearFieldError(endEl));

function markFieldError(el) {
    el.classList.add("is-invalid");
}
function clearFieldError(el) {
    el.classList.remove("is-invalid");
}

// 3. Reset Form
function resetForm() {
    todoForm.reset();
    priorityEl.value = "medium";
    todoEditingId = null;
    clearFieldError(titleEl);
    clearFieldError(endEl);
    btnAdd.innerText = "Add";
    btnAdd.classList.remove("btn-warning");
    btnAdd.classList.add("btn-primary");
}
btnReset.addEventListener("click", resetForm);

// 4. Render Tất Cả (Trung tâm điều khiển hiển thị)
async function renderAll() {
    const allTasks = db.getAllTasks();
    const searchTerm = searchInput.value.toLowerCase();

    // Lọc theo search input cho cả 2 danh sách
    const filteredTasks = allTasks.filter(t => t.title.toLowerCase().includes(searchTerm));

    // Tách mảng
    const currentTasks = filteredTasks.filter(task => task.is_archived === 0);
    const archivedTasks = filteredTasks.filter(task => task.is_archived === 1);

    // Render HTML
    renderTable(currentTasks, tbody, false);
    renderTable(archivedTasks, archiveTbody, true);

    // Render Chart (Dùng dữ liệu gốc chưa filter search để thống kê chính xác)
    renderOverviewChart(allTasks.filter(t => t.is_archived === 0));
    renderDailyChart(allTasks);

    // Render Stardust & Explorer Rank (tính trên toàn bộ task, kể cả archived)
    renderRankPanel(calculateRankProgress(allTasks));
}

// Input tìm kiếm (Real-time)
searchInput.addEventListener("input", renderAll);

// 5. Hàm Render Table dùng chung (Cho cả Current và Archive)
function renderTable(tasks, container, isArchiveView) {
    if (tasks.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="text-muted py-4">Không tìm thấy công việc nào...</td></tr>`;
        return;
    }

    const html = tasks.map((item, index) => {
        // Format ngày tháng đẹp
        const formatTime = (isoString) => isoString ? new Date(isoString).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' }) : '---';

        const statusClass = item.status === 1 ? 'completed' : 'pending';
        const statusIcon = item.status === 1 ? 'bx-check-circle' : 'bx-circle';
        const priorityHtml = getPriorityBadge(item.priority);
        const safeTitle = escapeHtml(item.title);
        const safeDescription = escapeHtml(item.description);

        // Logic Deadline Warning
        let deadlineClass = '';
        if (item.endTime && item.status === 0) {
            const now = new Date();
            const end = new Date(item.endTime);
            // Cảnh báo nếu còn dưới 24h và chưa quá hạn
            if (end > now && (end - now) < 24 * 60 * 60 * 1000) {
                deadlineClass = 'deadline-warning';
            }
        }

        // Nút bấm tùy ngữ cảnh
        let actionButtons = '';
        if (isArchiveView) {
            actionButtons = `
                <button class="btn btn-success btn-sm" onclick="window.restoreTodo(${item.id})" title="Khôi phục"><i class='bx bx-rotate-left'></i></button>
                <button class="btn btn-danger btn-sm" onclick="window.removeTodo(${item.id})" title="Xóa vĩnh viễn"><i class='bx bx-trash'></i></button>
            `;
        } else {
            const archiveBtn = item.status === 1
                ? `<button class="btn btn-info btn-sm ms-1" onclick="window.archiveTodo(${item.id})" title="Lưu trữ"><i class='bx bx-archive-in'></i></button>`
                : '';

            actionButtons = `
                <button class="btn btn-warning btn-sm" onclick="window.prepareUpdate(${item.id})" title="Sửa"><i class='bx bx-edit-alt'></i></button>
                <button class="btn btn-danger btn-sm" onclick="window.removeTodo(${item.id})" title="Xóa"><i class='bx bx-trash'></i></button>
                ${archiveBtn}
            `;
        }

        return `
            <tr class="${deadlineClass}">
                <td class="fw-bold text-secondary" data-label="STT">${index + 1}</td>
                <td class="text-start" data-label="Title">
                    <div class="${statusClass} task-title-wrapper" onclick="window.toggleStatus(${item.id})">
                        <i class="task-icon bx ${statusIcon}"></i>
                        <span>${safeTitle}</span>
                    </div>
                </td>
                <td class="text-start text-muted" style="max-width: 200px;" title="${safeDescription}" data-label="Description">${safeDescription}</td>
                <td data-label="Priority">${priorityHtml}</td>
                <td data-label="Start Time"><small>${formatTime(item.startTime)}</small></td>
                <td data-label="End Time"><small>${formatTime(item.endTime)}</small></td>
                <td data-label="Action">
                    <div class="d-flex justify-content-center gap-2">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = html;
}

// 6. Global Actions (Gắn vào window để HTML gọi được)

// Đổi trạng thái Hoàn thành/Chưa
window.toggleStatus = async (id) => {
    const task = db.getTaskById(id);
    if (!task) return;

    let newStatus = task.status === 0 ? 1 : 0;
    let newCompletedAt = newStatus === 1 ? new Date().toISOString() : null;

    db.toggleTaskStatus(id, newStatus, newCompletedAt);
    await renderAll();
};

// Chuẩn bị cập nhật (Đổ dữ liệu lên form)
window.prepareUpdate = (id) => {
    const task = db.getTaskById(id);
    if (!task) return;

    todoEditingId = id; // Gán ID đang sửa

    titleEl.value = task.title;
    descEl.value = task.description;
    priorityEl.value = task.priority;

    // FIX LỖI DATE: Input datetime-local cần định dạng "YYYY-MM-DDTHH:mm"
    // Nếu trong DB lưu ISO String có giây hoặc múi giờ (Z), ta phải cắt bỏ
    if(task.startTime) startEl.value = task.startTime.substring(0, 16);
    if(task.endTime) endEl.value = task.endTime.substring(0, 16);

    // Đổi giao diện nút
    btnAdd.innerText = "Update";
    btnAdd.classList.remove("btn-primary");
    btnAdd.classList.add("btn-warning");

    // Cuộn lên form
    titleEl.focus();
    todoForm.scrollIntoView({ behavior: 'smooth' });
};

// Xóa
window.removeTodo = async (id) => {
    const ok = await confirmAction("Bạn có chắc chắn muốn xóa vĩnh viễn?");
    if (ok) {
        db.deleteTask(id);
        // Nếu đang sửa chính task bị xóa thì reset form
        if (todoEditingId === id) resetForm();
        await renderAll();
        showToast("Đã xóa công việc.", "success");
    }
};

// Lưu trữ
window.archiveTodo = async (id) => {
    db.archiveTask(id);
    await renderAll();
    showToast("Đã lưu trữ công việc.", "success");
};

// Khôi phục
window.restoreTodo = async (id) => {
    db.restoreTask(id);
    await renderAll();
    showToast("Đã khôi phục công việc.", "success");
};

// Xóa tất cả task hiện tại
btnRemoveAll.addEventListener("click", async () => {
    const ok = await confirmAction("Cảnh báo: Bạn muốn xóa TẤT CẢ công việc đang có? (Không xóa Archive)");
    if (ok) {
        db.deleteAllCurrentTasks();
        await renderAll();
        showToast("Đã xóa toàn bộ công việc hiện tại.", "success");
    }
});


// 7. Helpers & UI Logic
function getPriorityBadge(priority) {
    const map = {
        'high': '<span class="priority-badge priority-high"><i class="bx bxs-rocket"></i> High</span>',
        'medium': '<span class="priority-badge priority-medium"><i class="bx bxs-planet"></i> Medium</span>',
        'low': '<span class="priority-badge priority-low"><i class="bx bx-moon"></i> Low</span>'
    };
    return map[priority] || map['medium'];
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Toggle Views
toggleArchiveBtn.addEventListener("click", () => {
    if (archiveSection.style.display === 'none') {
        archiveSection.style.display = 'block';
        toggleArchiveBtn.innerHTML = "<i class='bx bx-archive-out'></i> Hide Archive";
        toggleArchiveBtn.classList.add('active');
        archiveSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        archiveSection.style.display = 'none';
        toggleArchiveBtn.innerHTML = "<i class='bx bx-archive'></i> View Archive";
        toggleArchiveBtn.classList.remove('active');
    }
});

toggleStatsBtn.addEventListener("click", () => {
    if (statisticsSection.style.display === 'none') {
        statisticsSection.style.display = 'block';
        toggleStatsBtn.innerHTML = "<i class='bx bxs-pie-chart-alt-2'></i> Ẩn Thống Kê";
        toggleStatsBtn.classList.remove('btn-outline-success');
        toggleStatsBtn.classList.add('btn-success');
    } else {
        statisticsSection.style.display = 'none';
        toggleStatsBtn.innerHTML = "<i class='bx bx-pie-chart-alt-2'></i> Xem Thống Kê";
        toggleStatsBtn.classList.add('btn-outline-success');
        toggleStatsBtn.classList.remove('btn-success');
    }
});

// 8. Charts Logic
function renderOverviewChart(tasks) {
    if (!document.getElementById('overviewChart')) return;

    const completed = tasks.filter(t => t.status === 1).length;
    const pending = tasks.filter(t => t.status === 0).length;

    const ctx = document.getElementById('overviewChart').getContext('2d');

    if (overviewChartInstance) overviewChartInstance.destroy();

    overviewChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Đã xong', 'Chưa xong'],
            datasets: [{
                data: [completed, pending],
                backgroundColor: ['#00ff9d', '#ff416c'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#fff' } },
                title: { display: true, text: 'Tổng quan công việc hiện tại', color: '#fff' }
            }
        }
    });
}

function renderDailyChart(allTasks) {
    if (!document.getElementById('dailyChart')) return;

    const days = 7;
    const labels = [];
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);

        labels.push(d.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'}));

        // Đếm số task hoàn thành trong ngày này (so khớp theo ngày giờ địa phương,
        // đồng nhất với nhãn hiển thị ở trên - tránh lệch ngày với người dùng múi giờ != UTC)
        const count = allTasks.filter(t => {
            if (t.status !== 1 || !t.completedAt) return false;
            const completedDate = new Date(t.completedAt);
            return completedDate.getFullYear() === d.getFullYear()
                && completedDate.getMonth() === d.getMonth()
                && completedDate.getDate() === d.getDate();
        }).length;
        data.push(count);
    }

    const ctx = document.getElementById('dailyChart').getContext('2d');
    if (dailyChartInstance) dailyChartInstance.destroy();

    dailyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Công việc hoàn thành',
                data: data,
                backgroundColor: '#764ba2',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Năng suất 7 ngày qua', color: '#fff' }
            },
            scales: {
                y: { ticks: { color: '#bbb', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { ticks: { color: '#bbb' }, grid: { display: false } }
            }
        }
    });
}

// 9. Stardust & Explorer Rank
const STARDUST_BY_PRIORITY = { low: 10, medium: 20, high: 35 };
const STARDUST_PER_LEVEL = 100;
const RANK_TITLES = [
    "Tân Binh Vũ Trụ",
    "Phi Hành Gia Tập Sự",
    "Phi Hành Gia",
    "Chỉ Huy Tàu Con Thoi",
    "Thuyền Trưởng Liên Sao",
    "Nhà Thám Hiểm Thiên Hà",
    "Đô Đốc Ngân Hà",
    "Chúa Tể Vũ Trụ"
];

function calculateRankProgress(allTasks) {
    const stardust = allTasks
        .filter(t => t.status === 1)
        .reduce((sum, t) => sum + (STARDUST_BY_PRIORITY[t.priority] || STARDUST_BY_PRIORITY.medium), 0);

    const level = Math.floor(stardust / STARDUST_PER_LEVEL) + 1;
    const title = RANK_TITLES[Math.min(level - 1, RANK_TITLES.length - 1)];
    const intoLevel = stardust % STARDUST_PER_LEVEL;
    const progressPercent = intoLevel;
    const remainingToNextLevel = STARDUST_PER_LEVEL - intoLevel;

    return { stardust, level, title, progressPercent, remainingToNextLevel };
}

function renderRankPanel(data) {
    const rankName = document.getElementById('rankName');
    const rankLevel = document.getElementById('rankLevel');
    const rankProgressBar = document.getElementById('rankProgressBar');
    const rankStardust = document.getElementById('rankStardust');
    const rankNextInfo = document.getElementById('rankNextInfo');

    if (!rankName) return;

    rankName.textContent = data.title;
    rankLevel.textContent = `Lv. ${data.level}`;
    rankProgressBar.style.width = `${data.progressPercent}%`;
    rankProgressBar.setAttribute('aria-valuenow', String(data.progressPercent));
    rankStardust.innerHTML = `<i class='bx bxs-star'></i> ${data.stardust} Stardust`;
    rankNextInfo.textContent = `Còn ${data.remainingToNextLevel} Stardust để lên cấp`;
}

// 10. Toast Notifications (thay cho alert())
function showToast(message, type = 'success') {
    if (!toastContainer) return;

    const icons = {
        success: 'bx-check-circle',
        error: 'bx-error-circle',
        warning: 'bx-error'
    };

    const toastEl = document.createElement('div');
    toastEl.className = `toast-custom toast-${type}`;
    toastEl.innerHTML = `<i class="bx ${icons[type] || icons.success}"></i><span>${escapeHtml(message)}</span>`;

    toastContainer.appendChild(toastEl);

    // Force reflow để transition hoạt động
    void toastEl.offsetWidth;
    toastEl.classList.add('show');

    setTimeout(() => {
        toastEl.classList.remove('show');
        toastEl.addEventListener('transitionend', () => toastEl.remove(), { once: true });
    }, 3200);
}

// 11. Confirm Modal (thay cho confirm())
function confirmAction(message) {
    return new Promise((resolve) => {
        const modalEl = document.getElementById('confirmModal');
        const bodyEl = document.getElementById('confirmModalBody');
        const yesBtn = document.getElementById('confirmModalYesBtn');

        bodyEl.textContent = message;
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

        function onYes() {
            cleanup();
            resolve(true);
            modal.hide();
        }
        function onHidden() {
            cleanup();
            resolve(false);
        }
        function cleanup() {
            yesBtn.removeEventListener('click', onYes);
            modalEl.removeEventListener('hidden.bs.modal', onHidden);
        }

        yesBtn.addEventListener('click', onYes);
        modalEl.addEventListener('hidden.bs.modal', onHidden);
        modal.show();
    });
}
