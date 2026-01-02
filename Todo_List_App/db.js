let db; 

export async function initDatabase() {
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });
        
        db = new SQL.Database();
        console.log("Database initialized successfully!");

        // Tạo bảng với đầy đủ trường dữ liệu
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                priority TEXT DEFAULT 'medium',
                startTime TEXT,
                endTime TEXT,
                status INTEGER DEFAULT 0,
                completedAt TEXT,
                is_archived INTEGER DEFAULT 0
            );
        `;
        db.run(createTableQuery);

    } catch (err) {
        console.error("Failed to initialize database:", err);
        alert("Lỗi khởi tạo Database! Hãy kiểm tra console.");
    }
}

//Chuyển đổi kết quả SQL thành Array Object
function convertSqlResultsToObjects(sqlResult) {
    if (!sqlResult) return [];
    const { columns, values } = sqlResult;
    return values.map(row => {
        const obj = {};
        columns.forEach((colName, index) => {
            obj[colName] = row[index];
        });
        return obj;
    });
}

//Lấy tất cả các task
export function getAllTasks() {
    try {
        const res = db.exec("SELECT * FROM tasks ORDER BY id DESC"); // Lấy mới nhất lên đầu
        if (res.length === 0) return [];
        return convertSqlResultsToObjects(res[0]);
    } catch (err) {
        return [];
    }
}

//Lấy MỘT task
export function getTaskById(id) {
    try {
        const res = db.exec("SELECT * FROM tasks WHERE id = ?", [id]);
        if (res.length === 0) return null;
        return convertSqlResultsToObjects(res[0])[0];
    } catch (err) {
        return null;
    }
}

// 4. CREATE: Thêm task
export function addTask(todoData) {
    const query = `
        INSERT INTO tasks (title, description, priority, startTime, endTime, status, is_archived) 
        VALUES (?, ?, ?, ?, ?, 0, 0)
    `;
    db.run(query, [
        todoData.title, 
        todoData.description, 
        todoData.priority, 
        todoData.startTime, 
        todoData.endTime
    ]);
}

//Cập nhật thông tin task
export function updateTask(id, todoData) {
    const query = `
        UPDATE tasks 
        SET title = ?, description = ?, priority = ?, startTime = ?, endTime = ?
        WHERE id = ?
    `;
    db.run(query, [
        todoData.title, 
        todoData.description, 
        todoData.priority, 
        todoData.startTime, 
        todoData.endTime, 
        id
    ]);
}

//Đổi trạng thái (Hoàn thành / Chưa hoàn thành)
export function toggleTaskStatus(id, newStatus, newCompletedAt) {
     const query = "UPDATE tasks SET status = ?, completedAt = ? WHERE id = ?";
     db.run(query, [newStatus, newCompletedAt, id]);
}

//Chuyển vào kho lưu trữ
export function archiveTask(id) {
    // Chỉ archive, giữ nguyên trạng thái status
    const query = "UPDATE tasks SET is_archived = 1 WHERE id = ?";
    db.run(query, [id]);
}

//Khôi phục lại
export function restoreTask(id) {
    const query = "UPDATE tasks SET is_archived = 0 WHERE id = ?";
    db.run(query, [id]);
}

//Xóa vĩnh viễn 1 task
export function deleteTask(id) {
    const query = "DELETE FROM tasks WHERE id = ?";
    db.run(query, [id]);
}

//Xóa tất cả task chưa archive
export function deleteAllCurrentTasks() {
    const query = "DELETE FROM tasks WHERE is_archived = 0";
    db.run(query);
}
