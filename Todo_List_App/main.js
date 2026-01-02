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

// Biến toàn cục
let overviewChartInstance = null; 
let dailyChartInstance = null; 
let todoEditingId = null; // Lưu ID đang sửa (null nếu là thêm mới)

// --- MAIN LOGIC ---

// 1. Khởi chạy App
async function main() {
    await db.initDatabase(); 
    await renderAll();      
}
main();

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

    // Validation
    if (!todoData.title) { 
        alert("Vui lòng nhập tiêu đề công việc!");
        titleEl.focus();
        return;
    }

    if (todoData.startTime && todoData.endTime) {
        if (new Date(todoData.endTime) <= new Date(todoData.startTime)) {
            alert("Thời gian kết thúc phải SAU thời gian bắt đầu!");
            return;
        }
    }

    try {
        if (todoEditingId) {
            // Logic Update
            db.updateTask(todoEditingId, todoData);
            alert("Cập nhật thành công!");
        } else {
            // Logic Add New
            db.addTask(todoData);
        }

        resetForm(); // Reset form sau khi lưu
        await renderAll();

    } catch (err) {
        console.error("Lỗi khi submit:", err);
    }
});

// 3. Reset Form
function resetForm() {
    todoForm.reset();
    priorityEl.value = "medium"; 
    todoEditingId = null;
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
                <td class="fw-bold text-secondary">${index + 1}</td> 
                <td class="text-start">
                    <div class="${statusClass} task-title-wrapper" onclick="window.toggleStatus(${item.id})">
                        <i class="task-icon bx ${statusIcon}"></i>
                        <span>${item.title}</span>
                    </div>
                </td>
                <td class="text-start text-muted" style="max-width: 200px;" title="${item.description}">${item.description}</td>
                <td>${priorityHtml}</td>
                <td><small>${formatTime(item.startTime)}</small></td>
                <td><small>${formatTime(item.endTime)}</small></td>
                <td>
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
    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn?")) {
        db.deleteTask(id);
        // Nếu đang sửa chính task bị xóa thì reset form
        if (todoEditingId === id) resetForm();
        await renderAll();
    }
};

// Lưu trữ
window.archiveTodo = async (id) => {
    db.archiveTask(id);
    await renderAll();
};

// Khôi phục
window.restoreTodo = async (id) => {
    db.restoreTask(id);
    await renderAll();
};

// Xóa tất cả task hiện tại
btnRemoveAll.addEventListener("click", async () => {
    if (confirm("Cảnh báo: Bạn muốn xóa TẤT CẢ công việc đang có? (Không xóa Archive)")) {
        db.deleteAllCurrentTasks();
        await renderAll();
    }
});


// 7. Helpers & UI Logic
function getPriorityBadge(priority) {
    const map = {
        'high': '<span class="priority-badge priority-high">High</span>',
        'medium': '<span class="priority-badge priority-medium">Medium</span>',
        'low': '<span class="priority-badge priority-low">Low</span>'
    };
    return map[priority] || map['medium'];
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
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
        
        labels.push(d.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'}));
        
        // Đếm số task hoàn thành trong ngày này
        const count = allTasks.filter(t => {
            return t.status === 1 && t.completedAt && t.completedAt.startsWith(dateStr);
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