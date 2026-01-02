let db; 
/**
 * 1. Khởi tạo Database (Init)
 * Tải file .wasm và tạo bảng 'tasks'
 */
export async function initDatabase() {
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });
        
        db = new SQL.Database();
        console.log("Database initialized successfully!");

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
        console.log("Table 'tasks' created or already exists.");

    } catch (err) {
        console.error("Failed to initialize database:", err);
    }
}
/*Các tính năng chính/*
/**
 * 2. READ: Lấy TẤT CẢ task
 */
export function getAllTasks() {
    try {
        const res = db.exec("SELECT * FROM tasks");
        if (res.length === 0) return [];
        return convertSqlResultsToObjects(res[0]);
    } catch (err) {
        console.error("Error getting all tasks:", err);
        return [];
    }
}
/**
 * 3. READ: Lấy MỘT task bằng ID
 */
export function getTaskById(id) {
    try {
        const res = db.exec("SELECT * FROM tasks WHERE id = ?", [id]);
        if (res.length === 0) return null;
        return convertSqlResultsToObjects(res[0])[0];
    } catch (err) {
        console.error(`Error getting task by id ${id}:`, err);
        return null;
    }
}
/**
 * 4. CREATE: Thêm một task mới
 */
export function addTask(todoData) {
    try {
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
    } catch (err) {
        console.error("Error adding task:", err);
    }
}
/**
 * 5. UPDATE: Cập nhật một task
 */
export function updateTask(id, todoData) {
    try {
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
    } catch (err) {
        console.error("Error updating task:", err);
    }
}
/**
 * 6. UPDATE: Chuyển đổi trạng thái task
 */
export function toggleTaskStatus(id, newStatus, newCompletedAt) {
     try {
        const query = "UPDATE tasks SET status = ?, completedAt = ? WHERE id = ?";
        db.run(query, [newStatus, newCompletedAt, id]);
     } catch(err) {
         console.error("Error toggling task status:", err);
     }
}

/**
 * 7. UPDATE: Lưu trữ (Archive) một task
 */
export function archiveTask(id) {
    try {
        const query = "UPDATE tasks SET is_archived = 1 WHERE id = ?";
        db.run(query, [id]);
    } catch (err) {
        console.error("Error archiving task:", err);
    }
}
/**
 * 8. UPDATE: Khôi phục (Restore) một task
 */
export function restoreTask(id) {
    try {
        const query = "UPDATE tasks SET is_archived = 0, status = 0, completedAt = NULL WHERE id = ?";
        db.run(query, [id]);
    } catch (err) {
        console.error("Error restoring task:", err);
    }
}
/**
 * 9. DELETE: Xóa vĩnh viễn một task
 */
export function deleteTask(id) {
    try {
        const query = "DELETE FROM tasks WHERE id = ?";
        db.run(query, [id]);
    } catch (err) {
        console.error("Error deleting task:", err);
    }
}

/**
 * 10. DELETE: Xóa tất cả task hiện tại (chưa archive)
 */
export function deleteAllCurrentTasks() {
    try {
        const query = "DELETE FROM tasks WHERE is_archived = 0";
        db.run(query);
    } catch (err) {
        console.error("Error deleting all current tasks:", err);
    }
} 

// Chuyển đổi dữ liệu thành kết quả hiển thị
function convertSqlResultsToObjects(sqlResult) {
    const { columns, values } = sqlResult;
    return values.map(row => {
        const obj = {};
        columns.forEach((colName, index) => {
            obj[colName] = row[index];
        });
        return obj;
    });
}