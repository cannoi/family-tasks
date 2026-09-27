let token = '';
let userId = '';
let familyId = '';

function showRegisterForm() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

function showLoginForm() {
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
}

function showFamilyForm() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('family-form').style.display = 'block';
}

function showTaskForm() {
  document.getElementById('family-form').style.display = 'none';
  document.getElementById('task-form').style.display = 'block';
}

function showTaskList() {
  document.getElementById('task-form').style.display = 'none';
  document.getElementById('task-list').style.display = 'block';
  fetchTasks();
}

function showNotificationList() {
  document.getElementById('task-list').style.display = 'none';
  document.getElementById('notification-list').style.display = 'block';
  fetchNotifications();
}

async function register() {
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  const email = document.getElementById('reg-email').value;

  const response = await fetch('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password, email })
  });

  const data = await response.json();
  if (response.ok) {
    alert('Registration successful! Please login.');
    showLoginForm();
  } else {
    alert(data.error);
  }
}

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const response = await fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();
  if (response.ok) {
    token = data.token;
    userId = data.id;
    alert('Login successful!');
    showFamilyForm();
  } else {
    alert(data.error);
  }
}

async function createFamily() {
  const name = document.getElementById('family-name').value;

  const response = await fetch('/family', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name })
  });

  const data = await response.json();
  if (response.ok) {
    familyId = data.id;
    alert('Family created successfully!');
    showTaskForm();
  } else {
    alert(data.error);
  }
}

async function joinFamily() {
  const familyId = document.getElementById('family-id').value;

  const response = await fetch('/family/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId, familyId })
  });

  const data = await response.json();
  if (response.ok) {
    alert('Joined family successfully!');
    showTaskForm();
  } else {
    alert(data.error);n  }
}

async function createTask() {
  const title = document.getElementById('task-title').value;
  const description = document.getElementById('task-description').value;
  const due_date = document.getElementById('task-due-date').value;
  const assigned_to = document.getElementById('task-assigned-to').value;

  const response = await fetch('/task', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, description, due_date, family_id: familyId, assigned_to })
  });

  const data = await response.json();
  if (response.ok) {
    alert('Task created successfully!');
    showTaskList();
  } else {
    alert(data.error);
  }
}

async function fetchTasks() {
  const response = await fetch(`/tasks/${familyId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const tasks = await response.json();
  const taskList = document.getElementById('tasks');
  taskList.innerHTML = '';

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = `${task.title} - ${task.description} - Due: ${task.due_date} - Status: ${task.status}`;
    if (task.status === 'pending') {
      const completeButton = document.createElement('button');
      completeButton.textContent = 'Mark as Complete';
      completeButton.onclick = () => markTaskComplete(task.id);
      li.appendChild(completeButton);
    }
    taskList.appendChild(li);
  });
}

async function markTaskComplete(taskId) {
  const response = await fetch('/task/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ taskId })
  });

  const data = await response.json();
  if (response.ok) {
    alert('Task marked as completed!');
    fetchTasks();
  } else {
    alert(data.error);
  }
}

async function fetchNotifications() {
  const response = await fetch(`/notifications/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const notifications = await response.json();
  const notificationList = document.getElementById('notifications');
  notificationList.innerHTML = '';

  notifications.forEach(notification => {
    const li = document.createElement('li');
    li.textContent = `${notification.message} - Sent: ${notification.sent_at}`;
    notificationList.appendChild(li);
  });
}