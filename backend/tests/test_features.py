from unittest.mock import patch

def test_task_crud_lifecycle(client, auth_headers):
    """Test creating, listing, updating, and deleting study tasks."""
    # 1. Create task
    create_resp = client.post("/api/v1/tasks", headers=auth_headers, json={
        "title": "Master Backpropagation Derivation",
        "subject": "Machine Learning",
        "priority": "High"
    })
    assert create_resp.status_code == 201
    task = create_resp.json()
    task_id = task["id"]
    assert task["title"] == "Master Backpropagation Derivation"
    assert task["completed"] is False

    # 2. List tasks
    list_resp = client.get("/api/v1/tasks", headers=auth_headers)
    assert list_resp.status_code == 200
    tasks = list_resp.json()
    assert any(t["id"] == task_id for t in tasks)

    # 3. Update task (mark as completed)
    patch_resp = client.patch(f"/api/v1/tasks/{task_id}", headers=auth_headers, json={
        "completed": True
    })
    assert patch_resp.status_code == 200
    assert patch_resp.json()["completed"] is True

    # 4. Filter tasks by completed=True
    filter_resp = client.get("/api/v1/tasks?completed=true", headers=auth_headers)
    assert filter_resp.status_code == 200
    assert all(t["completed"] is True for t in filter_resp.json())

    # 5. Delete task
    del_resp = client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert del_resp.status_code == 200

    # 6. Verify task deleted
    get_resp = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert get_resp.status_code == 404

def test_dashboard_real_statistics(client, auth_headers):
    """Test dashboard stats endpoint calculates live values from database."""
    # Create 1 task
    client.post("/api/v1/tasks", headers=auth_headers, json={
        "title": "Solve 5 LeetCode problems",
        "subject": "Algorithms",
        "priority": "Medium"
    })

    resp = client.get("/api/v1/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_tasks"] >= 1
    assert "total_documents" in data
    assert "average_quiz_score" in data

def test_quiz_backend_grading(client, auth_headers, test_user, db_session):
    """Test backend grading computes correct scores without trusting client inputs."""
    from app.models.quiz import Quiz, QuizQuestion

    # Seed a quiz directly in DB
    quiz = Quiz(
        user_id=test_user.id,
        title="Test Computer Science Quiz",
        difficulty="medium"
    )
    db_session.add(quiz)
    db_session.commit()

    q1 = QuizQuestion(
        quiz_id=quiz.id,
        question="What is 2 + 2?",
        options=["2", "3", "4", "5"],
        correct_answer=2, # index 2 is "4"
        explanation="2 + 2 equals 4 by basic arithmetic."
    )
    db_session.add(q1)
    db_session.commit()

    # 1. Fetch quiz questions -> verify correct_answer is hidden from client
    get_q = client.get(f"/api/v1/quizzes/{quiz.id}", headers=auth_headers)
    assert get_q.status_code == 200
    q_data = get_q.json()["questions"][0]
    assert "correct_answer" not in q_data
    assert "explanation" not in q_data

    # 2. Submit correct answer
    sub_resp = client.post(f"/api/v1/quizzes/{quiz.id}/submit", headers=auth_headers, json={
        "answers": {q1.id: 2}
    })
    assert sub_resp.status_code == 200
    attempt = sub_resp.json()
    assert attempt["score"] == 1
    assert attempt["total_questions"] == 1
    assert attempt["percentage"] == 100
    assert attempt["results"][0]["is_correct"] is True
    assert attempt["results"][0]["explanation"] == "2 + 2 equals 4 by basic arithmetic."
