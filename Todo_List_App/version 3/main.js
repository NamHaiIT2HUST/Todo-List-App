import * as db from './db.js';

const todoForm = document.getElementById("todoForm");
const titleElement = document.getElementById("title");
const descriptionElement = document.getElementById("description");
const priorityElement = document.getElementById("priority"); 
const startTimeElement = document.getElementById("startTime"); 
const endTimeElement = document.getElementById("endTime");
const btnReset = document.getElementById("reset-btn");
const btnAdd = document.getElementById("add-btn");
const btnRemoveAll = document.getElementById("remove-all-btn");
const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("searchInput");
const toggleArchiveBtn = document.getElementById("toggleArchiveBtn");
const archiveSection = document.getElementById("archiveSection");
const archiveTbody = document.getElementById("archiveTbody");
const toggleStatsBtn = document.getElementById("toggleStatsBtn");
const statisticsSection = document.getElementById("statisticsSection");

let overviewChartInstance = null; 
let dailyChartInstance = null; 
let todoEditing = { id: null };

async function handleSubmit(event) {
    event.preventDefault();

    const todoData = {
        title: titleElement.value,
        description: descriptionElement.value,
        priority: priorityElement.value,
        startTime: startTimeElement.value,
        endTime: endTimeElement.value,
    };

    if (!validationTodo(todoData)) return;

    try {
        if (todoEditing.id) {
            db.updateTask(todoEditing.id, todoData);
        } 
        else {
            db.addTask(todoData);
        }

        await renderAll();
        resetForm();

    } catch (err) {
        console.error("Error handling submit:", err);
    }
}

async function toggleStatus(id) {
    try {
        const task = db.getTaskById(id);
        if (!task) return;

        let newStatus = 0;
        let newCompletedAt = null;

        if (task.status === 0) { // Nếu đang là 'pending'
            if (window.confirm("Bạn chắc chắn đã hoàn thành công việc này chưa?")) {
                newStatus = 1; // Chuyển sang 'completed'
                newCompletedAt = new Date().toISOString();
            } 
            else {
                return; 
            }
        } 

        db.toggleTaskStatus(id, newStatus, newCompletedAt);
        await renderAll();

    } catch (err) {
        console.error("Error toggling status:", err);
    }
}

async function removeTodo(id) {
    if (window.confirm("Are you sure you want to permanently delete this task?")) {
        try {
            // Gọi hàm DELETE từ db.js
            db.deleteTask(id);
            await renderAll();
        } catch (err) {
            console.error("Error removing todo:", err);
        }
    }
}

async function updateTodo(id) {
    try {
        const task = db.getTaskById(id);
        if (!task) return;

        todoEditing = task; 
        
        btnAdd.innerText = "Update";
        titleElement.value = task.title;
        descriptionElement.value = task.description;
        priorityElement.value = task.priority;
        startTimeElement.value = task.startTime;
        endTimeElement.value = task.endTime;
        titleElement.focus();

    } catch (err) {
        console.error("Error preparing update:", err);
    }
}

async function removeAll() {
    if (window.confirm("Are you sure you want to remove ALL CURRENT todos?")) {
        try {
            // Gọi hàm DELETE ALL từ db.js
            db.deleteAllCurrentTasks();
            await renderAll();
        } catch (err) {
            console.error("Error removing all current todos:", err);
        }
    }
}

function resetForm() {
    todoForm.reset();
    priorityElement.value = "medium"; 
    todoEditing = { id: null };
    btnAdd.innerText = "Add";
}

async function renderAll() {
    try {
        const allTasks = db.getAllTasks();

        const currentTasks = allTasks.filter(task => task.is_archived === 0);
        const archivedTasks = allTasks.filter(task => task.is_archived === 1);
        
        handleViewTodo(currentTasks);
        handleViewArchive(archivedTasks);
        renderOverviewChart(currentTasks);
        renderDailyChart(allTasks); 

    } catch (err) {
        console.error("Error in renderAll:", err);
    }
}

function handleViewTodo(tasks = []) {
    // Sửa lỗi cú pháp T
    const searchTerm = searchInput.value.toLowerCase();
    const filteredTodos = tasks.filter(item => 
        item.title.toLowerCase().includes(searchTerm)
    );

    if (filteredTodos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">Nothing todo (or no search results)</td></tr>`;
        return; 
    }

    const html = filteredTodos.map((item, index) => {
        const start = item.startTime ? new Date(item.startTime).toLocaleString('vi-VN') : '';
        const end = item.endTime ? new Date(item.endTime).toLocaleString('vi-VN') : '';
        
        const statusClass = item.status === 1 ? 'completed' : 'pending';
        const statusIcon = item.status === 1 ? 'bx-check' : 'bx-x';

        let priorityHtml = getPriorityHtml(item.priority);

        let deadlineClass = '';
        if (item.endTime && item.status === 0) {
            const now = new Date();
            const endTimeDate = new Date(item.endTime);
            const oneDay = 24 * 60 * 60 * 1000;
            if (endTimeDate - now < oneDay && endTimeDate > now) {
                deadlineClass = 'deadline-warning';
            }
        }

        const archiveButton = item.status === 1
            ? `<button class="btn btn-info btn-sm mt-1" onclick="archiveTodo(${item.id})">Archive</button>` 
            : '';

        return `
            <tr class="${deadlineClass}">
                <td>${index + 1}</td> 
                <td>
                    <p class="${statusClass}" onclick="toggleStatus(${item.id})">
                        ${item.title} - <i class="icon bx ${statusIcon}"></i>
                    </p>
                </td>
                <td>${item.description}</td>
                <td>${priorityHtml}</td>
                <td>${start}</td>
                <td>${end}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="updateTodo(${item.id})">Update</button>
                    <button class="btn btn-danger btn-sm" onclick="removeTodo(${item.id})">Remove</button>
                    ${archiveButton}
                </td>
            </tr>
        `;
    }).join(''); 

    tbody.innerHTML = html;
}

function handleViewArchive(tasks = []) {
    if (tasks.length === 0) {
        archiveTbody.innerHTML = `<tr><td colspan="7">Archive is empty</td></tr>`;
        return; 
    }

    const html = tasks.map((item, index) => {
        const start = item.startTime ? new Date(item.startTime).toLocaleString('vi-VN') : '';
        const end = item.endTime ? new Date(item.endTime).toLocaleString('vi-VN') : '';
        let priorityHtml = getPriorityHtml(item.priority);

        return `
            <tr>
                <td>${index + 1}</td> 
                <td>${item.title}</td>
                <td>${item.description}</td>
                <td>${priorityHtml}</td>
                <td>${start}</td>
                <td>${end}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="restoreTodo(${item.id})">Restore</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteFromArchive(${item.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join(''); 

    archiveTbody.innerHTML = html;
}

function archiveTodo(id) {
    try {
        db.archiveTask(id);
        renderAll(); 
    } catch (err) {
        console.error("Error archiving todo:", err);
    }
}

function restoreTodo(id) {
    try {
        db.restoreTask(id);
        renderAll();
    } catch (err) {
        console.error("Error restoring todo:", err);
    }
}

function deleteFromArchive(id) {
    if (window.confirm("Are you sure you want to permanently delete this from archive?")) {
        try {
            db.deleteTask(id); 
            renderAll();
        } catch (err) {
            console.error("Error deleting from archive:", err);
        }
    }
}
//Biểu đồ
function toggleArchiveView() {
    const isHidden = archiveSection.style.display === 'none';
    if (isHidden) {
        archiveSection.style.display = 'block';
        toggleArchiveBtn.innerHTML = "<i class='bx bx-archive-out'></i> Hide Archive";
        toggleArchiveBtn.classList.remove('btn-outline-primary');
        toggleArchiveBtn.classList.add('btn-primary');
    } else {
        archiveSection.style.display = 'none';
        toggleArchiveBtn.innerHTML = "<i class='bx bx-archive'></i> View Archive";
        toggleArchiveBtn.classList.add('btn-outline-primary');
        toggleArchiveBtn.classList.remove('btn-primary');
    }
}

function toggleStatisticsView() {
     const isHidden = statisticsSection.style.display === 'none';
    if (isHidden) {
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
}

function renderOverviewChart(currentTasks) {
    const completedCount = currentTasks.filter(item => item.status === 1).length;
    const pendingCount = currentTasks.filter(item => item.status === 0).length;
    const ctx = document.getElementById('overviewChart').getContext('2d'); 
    const data = {
        labels: ['Đã hoàn thành', 'Chưa hoàn thành'],
        datasets: [{
            label: 'Trạng thái công việc',
            data: [completedCount, pendingCount], 
            backgroundColor: ['rgba(75, 192, 192, 0.5)', 'rgba(255, 99, 132, 0.5)'],
            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
            borderWidth: 1
        }]
    };
    if (overviewChartInstance) { overviewChartInstance.destroy(); }
    overviewChartInstance = new Chart(ctx, { 
        type: 'pie', data,
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Thống kê công việc tổng quan' }
            }
        }
    });
}

function renderDailyChart(allTasks) {
    const labels = [];
    const dailyCounts = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().split('T')[0];
        dailyCounts[dayKey] = 0;
        const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        labels.push(label);
    }
    const allCompletedTasks = allTasks.filter(task => task.completedAt);
    allCompletedTasks.forEach(task => {
        const taskCompletedDate = new Date(task.completedAt).toISOString().split('T')[0];
        if (dailyCounts.hasOwnProperty(taskCompletedDate)) {
            dailyCounts[taskCompletedDate]++;
        }
    });
    const dataValues = Object.values(dailyCounts);
    const ctx = document.getElementById('dailyChart').getContext('2d');
    const data = {
        labels: labels,
        datasets: [{
            label: 'Số công việc hoàn thành',
            data: dataValues,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };
    if (dailyChartInstance) { dailyChartInstance.destroy(); }
    dailyChartInstance = new Chart(ctx, {
        type: 'bar', data,
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Tiến độ hoàn thành 7 ngày qua' }
            },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

function getPriorityHtml(priority) {
    switch (priority) {
        case 'high': return `<span class="priority-high">High</span>`;
        case 'low': return `<span class="priority-low">Low</span>`;
        default: return `<span class="priority-medium">Medium</span>`;
    }
}

function validationTodo(todo) {
    if (!todo.title || !todo.description) { 
        alert("Please enter Title and Description!");
        return false;
    }
    if (todo.startTime && todo.endTime) {
        const start = new Date(todo.startTime);
        const end = new Date(todo.endTime);
        if (end <= start) {
            alert("End Time must be after Start Time!");
            return false;
        }
    }
    return true;
}

todoForm.addEventListener("submit", handleSubmit);
btnReset.addEventListener("click", resetForm);
btnRemoveAll.addEventListener("click", removeAll);
searchInput.addEventListener("input", () => renderAll()); 
toggleArchiveBtn.addEventListener("click", toggleArchiveView); 
toggleStatsBtn.addEventListener("click", toggleStatisticsView);

window.toggleStatus = toggleStatus;
window.updateTodo = updateTodo;
window.removeTodo = removeTodo;
window.archiveTodo = archiveTodo;
window.restoreTodo = restoreTodo;
window.deleteFromArchive = deleteFromArchive;

async function main() {
    await db.initDatabase(); 
    await renderAll();      
}

main();