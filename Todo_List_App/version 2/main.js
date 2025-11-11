const todoForm = document.getElementById("todoForm");
const titleElement = document.getElementById("title");
const descriptionElement = document.getElementById("description");
const startTimeElement = document.getElementById("startTime"); 
const endTimeElement = document.getElementById("endTime");
const btnReset = document.getElementById("reset-btn");
const btnAdd = document.getElementById("add-btn");
const btnRemoveAll = document.getElementById("remove-all-btn");
const tbody = document.getElementById("tbody");

let todoSaved = JSON.parse(localStorage.getItem("todos") || "[]");
let todoEditing = {
    id: null,
};

let myChartInstance = null; 

function handleSubmit(event) {
    event.preventDefault();

    const todoData = {
        title: titleElement.value,
        description: descriptionElement.value,
        startTime: startTimeElement.value,
        endTime: endTimeElement.value,
    };

    if (!validationTodo(todoData)) return;

    if (todoEditing.id) {
        const todo = {
            ...todoEditing,
            ...todoData,
        };
        
        todoSaved = todoSaved.map(item => {
            if (item.id == todoEditing.id) {
                return todo;
            }
            return item;
        });
    } 
    else {
        const todo = {
            ...todoData,
            id: generateRandomId(4),
            status: false, 
        };
        todoSaved.push(todo);
    }
    
    handleViewTodo(todoSaved); 
    saveTodos(todoSaved);      
    resetForm();
    renderChart(); 
}

function toggleStatus(id) {
    let task = todoSaved.find(item => item.id == id);
    if (!task) return;

    if (task.status === false) { 
        if (window.confirm("Bạn chắc chắn đã hoàn thành công việc này chưa?")) {
            task.status = true;
        } else {
            return; 
        }
    } 
    else { 
        task.status = false; 
    }
    
    saveTodos(todoSaved);
    handleViewTodo(todoSaved);
    renderChart(); 
}

function removeTodo(id) {
    if (window.confirm("Are you sure?")) {
        todoSaved = todoSaved.filter(item => item.id != id);
        handleViewTodo(todoSaved);
        saveTodos(todoSaved);
        renderChart(); 
    }
}

function updateTodo(id) {
    todoEditing = todoSaved.find(item => item.id == id);
    btnAdd.innerText = "Update";
    titleElement.value = todoEditing.title;
    descriptionElement.value = todoEditing.description;
    startTimeElement.value = todoEditing.startTime;
    endTimeElement.value = todoEditing.endTime;
    titleElement.focus();
}

function removeAll() {
    if (window.confirm("Are you sure you want to remove ALL todos?")) {
        todoSaved = [];
        handleViewTodo(todoSaved);
        saveTodos(todoSaved);
        renderChart(); 
    }
}

function resetForm() {
    todoForm.reset();
    todoEditing = {
        id: null,
    };
    btnAdd.innerText = "Add";
}

function handleViewTodo(todos = []) {
    if (todos.length === 0) {
        tbody.innerHTML = `<tr>
                            <td colspan="6">Nothing todo</td> 
                        </tr>`;
        return; 
    }

    const html = todos.map((item, index) => {
        const start = item.startTime ? new Date(item.startTime).toLocaleString('vi-VN') : '';
        const end = item.endTime ? new Date(item.endTime).toLocaleString('vi-VN') : '';

        const statusClass = item.status ? 'completed' : 'pending';
        const statusIcon = item.status ? 'bx-check' : 'bx-x'; // Icon check (xanh) hoặc x (đỏ)

        return `
            <tr>
                <td>${index + 1}</td> 
                <td>
                    <p class="${statusClass}" onclick="toggleStatus('${item.id}')">
                        ${item.title} - <i class="icon bx ${statusIcon}"></i>
                    </p>
                </td>
                <td>${item.description}</td>
                <td>${start}</td>
                <td>${end}</td>
                
                <td>
                    <button class="btn btn-warning btn-sm" onclick="updateTodo('${item.id}')">Update</button>
                    <button class="btn btn-danger btn-sm" onclick="removeTodo('${item.id}')">Remove</button>
                </td>
            </tr>
        `;
    }).join(''); 

    tbody.innerHTML = html;
}

function saveTodos(todos) {
    localStorage.setItem("todos", JSON.stringify(todos));
}

function renderChart() {
    // 1. Lấy "database" hoàn thành
    const completedCount = todoSaved.filter(item => item.status === true).length;
    const pendingCount = todoSaved.filter(item => item.status === false).length;

    const ctx = document.getElementById('myChart').getContext('2d');

    const data = {
        labels: [
            'Đã hoàn thành', 
            'Chưa hoàn thành'  
        ],
        datasets: [{
            label: 'Trạng thái công việc',
            data: [completedCount, pendingCount], 
            backgroundColor: [
                'rgba(75, 192, 192, 0.5)', 
                'rgba(255, 99, 132, 0.5)'  
            ],
            borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 1
        }]
    };

    if (myChartInstance) {
        myChartInstance.destroy();
    }

    myChartInstance = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Thống kê công việc'
                }
            }
        }
    });
}

function validationTodo(todo) {
    if (!todo.title || !todo.description) { 
        alert("Please enter Title and Description!");
        return false;
    }
    return true;
}

function generateRandomId(n, prefix = "todo-") {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = prefix;
    for (let i = 0; i < n; i++) {
        id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
}

todoForm.addEventListener("submit", handleSubmit);
btnReset.addEventListener("click", resetForm);
btnRemoveAll.addEventListener("click", removeAll);

handleViewTodo(todoSaved);
renderChart(); 