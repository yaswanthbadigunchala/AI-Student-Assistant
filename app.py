from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI
import os

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

app = Flask(__name__)

# --------------------------------------------------
# Configuration
# --------------------------------------------------

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///student.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# --------------------------------------------------
# Database Models
# --------------------------------------------------

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.String(50), nullable=True)
    priority = db.Column(db.String(20), default="Medium")
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date,
            "priority": self.priority,
            "completed": self.completed,
            "created_at": self.created_at.strftime("%Y-%m-%d")
        }


class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(100), nullable=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "subject": self.subject,
            "content": self.content,
            "created_at": self.created_at.strftime("%Y-%m-%d")
        }


# --------------------------------------------------
# Home Page
# --------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


# --------------------------------------------------
# Dashboard API
# --------------------------------------------------

@app.route("/api/dashboard", methods=["GET"])
def dashboard():

    total_tasks = Task.query.count()
    completed_tasks = Task.query.filter_by(completed=True).count()
    pending_tasks = Task.query.filter_by(completed=False).count()
    total_notes = Note.query.count()

    return jsonify({
        "success": True,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "total_notes": total_notes
    })


# --------------------------------------------------
# TASK APIs
# --------------------------------------------------

@app.route("/api/tasks", methods=["GET"])
def get_tasks():

    tasks = Task.query.order_by(Task.created_at.desc()).all()

    return jsonify({
        "success": True,
        "tasks": [task.to_dict() for task in tasks]
    })


@app.route("/api/tasks", methods=["POST"])
def create_task():

    data = request.get_json()

    title = data.get("title", "").strip()

    if not title:
        return jsonify({
            "success": False,
            "error": "Task title is required."
        }), 400

    task = Task(
        title=title,
        description=data.get("description", ""),
        due_date=data.get("due_date", ""),
        priority=data.get("priority", "Medium"),
        completed=False
    )

    db.session.add(task)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Task created successfully.",
        "task": task.to_dict()
    }), 201


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):

    task = db.session.get(Task, task_id)

    if not task:
        return jsonify({
            "success": False,
            "error": "Task not found."
        }), 404

    data = request.get_json()

    if "title" in data:
        task.title = data["title"]

    if "description" in data:
        task.description = data["description"]

    if "due_date" in data:
        task.due_date = data["due_date"]

    if "priority" in data:
        task.priority = data["priority"]

    if "completed" in data:
        task.completed = bool(data["completed"])

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Task updated successfully.",
        "task": task.to_dict()
    })


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):

    task = db.session.get(Task, task_id)

    if not task:
        return jsonify({
            "success": False,
            "error": "Task not found."
        }), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Task deleted successfully."
    })


# --------------------------------------------------
# NOTES APIs
# --------------------------------------------------

@app.route("/api/notes", methods=["GET"])
def get_notes():

    notes = Note.query.order_by(Note.updated_at.desc()).all()

    return jsonify({
        "success": True,
        "notes": [note.to_dict() for note in notes]
    })


@app.route("/api/notes", methods=["POST"])
def create_note():

    data = request.get_json()

    title = data.get("title", "").strip()
    content = data.get("content", "").strip()

    if not title or not content:
        return jsonify({
            "success": False,
            "error": "Title and content are required."
        }), 400

    note = Note(
        title=title,
        subject=data.get("subject", ""),
        content=content
    )

    db.session.add(note)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Note created successfully.",
        "note": note.to_dict()
    }), 201


@app.route("/api/notes/<int:note_id>", methods=["PUT"])
def update_note(note_id):

    note = db.session.get(Note, note_id)

    if not note:
        return jsonify({
            "success": False,
            "error": "Note not found."
        }), 404

    data = request.get_json()

    if "title" in data:
        note.title = data["title"]

    if "subject" in data:
        note.subject = data["subject"]

    if "content" in data:
        note.content = data["content"]

    note.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Note updated successfully.",
        "note": note.to_dict()
    })


@app.route("/api/notes/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):

    note = db.session.get(Note, note_id)

    if not note:
        return jsonify({
            "success": False,
            "error": "Note not found."
        }), 404

    db.session.delete(note)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Note deleted successfully."
    })


# --------------------------------------------------
# AI CHAT
# --------------------------------------------------

@app.route("/api/ai/chat", methods=["POST"])
def ai_chat():

    data = request.get_json()
    message = data.get("message", "").strip()

    if not message:
        return jsonify({
            "success": False,
            "error": "Please enter a question."
        }), 400

    try:

        response = client.responses.create(
            model="gpt-5.6",
            instructions="""
You are StudyAI, an AI Student Assistant.

Help students with:
- Academic questions
- Programming
- Mathematics
- Computer Science
- Assignments
- Exam preparation
- Study techniques
- Time management

Explain concepts clearly and simply.
Use examples when helpful.
Help students understand the solution rather than
only providing an answer.
""",
            input=message
        )

        return jsonify({
            "success": True,
            "response": response.output_text
        })

    except Exception as exc:

        print("AI ERROR:", repr(exc))

        return jsonify({
            "success": False,
            "error": str(exc)
        }), 500

# --------------------------------------------------
# Create Database
# --------------------------------------------------

with app.app_context():
    db.create_all()


# --------------------------------------------------
# Run Application
# --------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)