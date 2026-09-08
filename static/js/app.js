document.addEventListener("DOMContentLoaded", function () {
    console.log("AI Student Assistant JavaScript loaded!");

    loadDashboard();
    loadTasks();
    loadNotes();
});


function showSection(sectionName) {

    console.log("Opening section:", sectionName);

    // Hide all sections
    document.querySelectorAll(".section").forEach(function (section) {
        section.classList.remove("active-section");
    });

    // Show selected section
    const section = document.getElementById(sectionName);

    if (section) {
        section.classList.add("active-section");
    }

    // Update navigation
    document.querySelectorAll(".nav-item").forEach(function (button) {
        button.classList.remove("active");
    });

    // Update title
    const titles = {
        dashboard: "Dashboard",
        chat: "AI Assistant",
        tasks: "Tasks",
        notes: "Notes",
        planner: "Study Planner"
    };

    const title = document.getElementById("page-title");

    if (title) {
        title.textContent = titles[sectionName] || "Dashboard";
    }
}


// =============================
// DASHBOARD
// =============================

async function loadDashboard() {

    try {

        const response = await fetch("/api/dashboard");

        const data = await response.json();

        document.getElementById("totalTasks").textContent =
            data.total_tasks;

        document.getElementById("pendingTasks").textContent =
            data.pending_tasks;

        document.getElementById("completedTasks").textContent =
            data.completed_tasks;

        document.getElementById("totalNotes").textContent =
            data.total_notes;

    } catch (error) {

        console.error("Dashboard error:", error);

    }
}


// =============================
// TASKS
// =============================

function openTaskForm() {

    document.getElementById("taskForm")
        .classList.remove("hidden");
}


function closeTaskForm() {

    document.getElementById("taskForm")
        .classList.add("hidden");
}


async function addTask() {

    const title =
        document.getElementById("taskTitle").value.trim();

    const description =
        document.getElementById("taskDescription").value.trim();

    const dueDate =
        document.getElementById("taskDueDate").value;

    const priority =
        document.getElementById("taskPriority").value;


    if (!title) {

        alert("Please enter a task title.");

        return;
    }


    try {

        const response = await fetch("/api/tasks", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                title: title,
                description: description,
                due_date: dueDate,
                priority: priority
            })

        });


        const data = await response.json();


        if (!response.ok) {

            alert(data.error || "Could not add task.");

            return;
        }


        // Clear form

        document.getElementById("taskTitle").value = "";
        document.getElementById("taskDescription").value = "";
        document.getElementById("taskDueDate").value = "";

        closeTaskForm();

        await loadTasks();
        await loadDashboard();

    } catch (error) {

        console.error(error);

        alert("Server error. Check the Flask terminal.");

    }
}


async function loadTasks() {

    try {

        const response = await fetch("/api/tasks");

        const tasks = await response.json();

        const taskList =
            document.getElementById("taskList");

        taskList.innerHTML = "";


        if (tasks.length === 0) {

            taskList.innerHTML = `
                <div class="empty-state">
                    <h3>No tasks yet 📋</h3>
                    <p>Click "+ Add Task" to create one.</p>
                </div>
            `;

            return;
        }


        tasks.forEach(function (task) {

            const div = document.createElement("div");

            div.className = "task-item";


            div.innerHTML = `
                <div class="task-left">

                    <input
                        type="checkbox"
                        ${task.completed ? "checked" : ""}
                        onchange="toggleTask(${task.id}, this.checked)"
                    >

                    <div>

                        <div class="task-title ${
                            task.completed
                                ? "task-completed"
                                : ""
                        }">

                            ${escapeHTML(task.title)}

                            <span class="priority priority-${task.priority.toLowerCase()}">
                                ${escapeHTML(task.priority)}
                            </span>

                        </div>

                        <div class="task-info">

                            ${escapeHTML(task.description || "")}

                            ${
                                task.due_date
                                    ? " • Due: " +
                                      escapeHTML(task.due_date)
                                    : ""
                            }

                        </div>

                    </div>

                </div>

                <div class="task-actions">

                    <button
                        class="delete-btn"
                        onclick="deleteTask(${task.id})"
                    >
                        🗑️
                    </button>

                </div>
            `;


            taskList.appendChild(div);

        });

    } catch (error) {

        console.error("Task loading error:", error);

    }
}


async function toggleTask(taskId, completed) {

    try {

        await fetch(`/api/tasks/${taskId}`, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                completed: completed
            })

        });


        await loadTasks();
        await loadDashboard();

    } catch (error) {

        console.error(error);

    }
}


async function deleteTask(taskId) {

    if (!confirm("Delete this task?")) {
        return;
    }


    try {

        await fetch(`/api/tasks/${taskId}`, {

            method: "DELETE"

        });


        await loadTasks();
        await loadDashboard();

    } catch (error) {

        console.error(error);

    }
}


// =============================
// NOTES
// =============================

function openNoteForm() {

    document.getElementById("noteForm")
        .classList.remove("hidden");
}


function closeNoteForm() {

    document.getElementById("noteForm")
        .classList.add("hidden");
}


async function addNote() {

    const title =
        document.getElementById("noteTitle").value.trim();

    const subject =
        document.getElementById("noteSubject").value.trim();

    const content =
        document.getElementById("noteContent").value.trim();


    if (!title || !content) {

        alert("Please enter title and content.");

        return;
    }


    try {

        const response = await fetch("/api/notes", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                title: title,
                subject: subject,
                content: content
            })

        });


        const data = await response.json();


        if (!response.ok) {

            alert(data.error || "Could not save note.");

            return;
        }


        document.getElementById("noteTitle").value = "";
        document.getElementById("noteSubject").value = "";
        document.getElementById("noteContent").value = "";

        closeNoteForm();

        await loadNotes();
        await loadDashboard();

    } catch (error) {

        console.error(error);

        alert("Server error. Check Flask.");

    }
}


async function loadNotes() {

    try {

        const response = await fetch("/api/notes");

        const notes = await response.json();

        const notesList =
            document.getElementById("notesList");

        notesList.innerHTML = "";


        if (notes.length === 0) {

            notesList.innerHTML = `
                <div class="empty-state">
                    <h3>No notes yet 📝</h3>
                    <p>Click "+ Add Note" to create one.</p>
                </div>
            `;

            return;
        }


        notes.forEach(function (note) {

            const div = document.createElement("div");

            div.className = "note-card";


            div.innerHTML = `
                <button
                    class="note-delete"
                    onclick="deleteNote(${note.id})"
                >
                    🗑️
                </button>

                <h3>${escapeHTML(note.title)}</h3>

                <div class="note-subject">
                    ${escapeHTML(note.subject || "")}
                </div>

                <div class="note-content">
                    ${escapeHTML(note.content)}
                </div>
            `;


            notesList.appendChild(div);

        });

    } catch (error) {

        console.error("Notes error:", error);

    }
}


async function deleteNote(noteId) {

    if (!confirm("Delete this note?")) {
        return;
    }


    try {

        await fetch(`/api/notes/${noteId}`, {

            method: "DELETE"

        });


        await loadNotes();
        await loadDashboard();

    } catch (error) {

        console.error(error);

    }
}


// =============================
// AI CHAT
// =============================

async function sendMessage() {

    const input =
        document.getElementById("chatInput");

    const message =
        input.value.trim();


    if (!message) {

        alert("Please enter a question.");

        return;
    }


    const chatMessages =
        document.getElementById("chatMessages");


    chatMessages.innerHTML += `
        <div class="message user-message">

            <div class="message-avatar">
                👤
            </div>

            <div class="message-content">

                <strong>You</strong>

                <p>${escapeHTML(message)}</p>

            </div>

        </div>
    `;


    input.value = "";


    try {

        const response = await fetch("/api/ai/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message
            })

        });


        const data = await response.json();


        chatMessages.innerHTML += `
            <div class="message ai-message">

                <div class="message-avatar">
                    🤖
                </div>

                <div class="message-content">

                    <strong>StudyAI</strong>

                    <p>${escapeHTML(
                        data.response ||
                        data.error ||
                        "No response."
                    )}</p>

                </div>

            </div>
        `;


        chatMessages.scrollTop =
            chatMessages.scrollHeight;

    } catch (error) {

        console.error(error);

        alert("Could not connect to Flask.");

    }
}


// =============================
// STUDY PLANNER
// =============================

async function generateStudyPlan() {

    const subjects =
        document.getElementById("plannerSubjects").value.trim();

    const examDate =
        document.getElementById("plannerDate").value;

    const hours =
        document.getElementById("plannerHours").value;


    if (!subjects || !examDate) {

        alert("Please enter subjects and exam date.");

        return;
    }


    const result =
        document.getElementById("studyPlanResult");

    result.classList.remove("hidden");

    result.innerText = "Generating study plan...";


    try {

        const response = await fetch(
            "/api/ai/study-plan",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    subjects: subjects,
                    exam_date: examDate,
                    hours_per_day: hours
                })

            }
        );


        const data = await response.json();

        result.innerText =
            data.plan ||
            data.error ||
            "Unable to generate plan.";

    } catch (error) {

        console.error(error);

        result.innerText =
            "Could not connect to server.";
    }
}


// =============================
// SECURITY
// =============================

function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}