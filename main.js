/*
1. Thêm việc cần làm
2. Xem danh sách việc cần làm
3. Lưu trữ việc cần làm
4. Cập nhật trạng thái
5. Sửa việc cần làm
6. Ghi chi tiết nội dung cho việc cần làm
7. Xóa việc cần làm
*/

const todoForm = document.getElementById("todoForm");
const titleElement = document.getElementById("title");
const descriptionElement = document.getElementById("description");

const btnReset = document.getElementById("reset-btn");
const btnAdd = document.getElementById("add-btn");

const tbody = document.getElementById("tbody");

let todoSaved = JSON.parse(localStorage.getItem("todos") || "[]");
console.log(todoSaved);

let todoEditing = {
    id: null,
};

function generateRandomId(n, prefix = "todo-") {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
    let id = prefix;
    for (let i = 0; i < n; i++) {
        id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
}

function validationTodo(todo) {
    if(!todo.title || !todo.descripton) {
        alert("Please enter full fields!");
        return false;
    }
    return true;
}

todoForm.addEventListener("submit", function() {
    event.preventDefault();

    if(todoEditing.id) {
        //edit
        const todo = {
            ...todoEditing, 
            title: titleElement.value,
            description: descriptionElement.value,
        };
        if (!validationTodo(todo)) return;
        todoSaved = todoSaved.map(item => {
            if (item.id == todoEditing.id) {
                return todo;
            }
            return item;
        })
        handleViewTodo(todoSaved);
    }
    else {
        //add
        const todo = {
            title: titleElement.value,
            descripton: descriptionElement.value,
            id: generateRandomId(4),
            status: false,
        };
        if (!validationTodo(todo)) return;
        todoSaved.push(todo);
    }
    
    handleViewTodo(todoSaved);
    resetForm();
});

function handleViewTodo(todos = []) {
    tbody.innerText = "";
    todos.length > 0 
    ? todos.forEach(item => {
        let trElement = document.createElement("tr")
        trElement.innerHTML = `
            <td>${item.id}</td>
            <td>
                <p class = '${item.status ? ("completed") : ("pending")}' onclick="toggleStatus('${item.id}')">
                    ${item.title} - ${item.status ? '<i class="icon bx bx-check"></i>' : '<i class="icon bx bx-x"></i>'}
                </p>
            </td>
            <td>${item.descripton}</td>
            <td>
                <button class="btn btn-warning" onclick="updateTodo('${item.id}')">Update</button>
                <button class="btn btn-danger" onclick="removeTodo('${item.id}')">Remove</button>
            </td>
        `;
        tbody.appendChild(trElement);
    }) 
    : (tbody.innerHTML = `<tr>
                    <td colspan="4">Nothing todo</td>
                </tr>`);

    localStorage.setItem("todos", JSON.stringify(todos));
}

function toggleStatus(id) {
    todoSaved = todoSaved.map((item) => {
        if(item.id == id) {
            item.status = !item.status;
        }
        return item;
    });
    handleViewTodo(todoSaved);
}

function removeTodo(id) {
    if(window.confirm("Are you sure?")) {
        todoSaved = todoSaved.filter(item => item.id != id);
        handleViewTodo(todoSaved);
    }
}

function updateTodo(id) {
    todoEditing = todoSaved.find(item => item.id == id);
    btnAdd.innerText = "Update";
    titleElement.value = todoEditing.title;
    descriptionElement.value = todoEditing.description;
}

function resetForm() {
    todoForm.reset();
    todoEditing = {
        id: null,
    };
    btnAdd.innerText = "Add";
}

function removeAll() {
    todoSaved = [];
    localStorage.setItem("todos", "[]");
    handleViewTodo();
}

btnReset.addEventListener("click", resetForm);

handleViewTodo(todoSaved);