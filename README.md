# Accountant Task Manager

> A secure, session-locked task management dashboard built specifically for tax professionals to organize client deadlines and protect sensitive financial data.

![Project Status](https://img.shields.io/badge/Status-MVP%20Complete-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## 📖 Project Overview

This project is a **Relational CRM & Task Manager** designed to solve the specific pain points of accountants: security risks on shared computers, deadline fragmentation, and "feature bloat" in generic tools.

Unlike a standard To-Do list, this application links every task to a specific **Client Profile** in a relational database, ensuring that work is always organized by customer account.

### 🚀 Key Features

* **Client-Centric Workflow**: Tasks are relationally linked to clients, allowing for instant "per-client" status filtering.
* **Session-Locked Security**: Custom authentication middleware ensures user sessions are cleared immediately upon tab closure to prevent unauthorized access on shared devices.
* **Visual Priority System**: Large, color-coded "Priority Tiles" (High/Medium/Low) replace small text labels for faster decision-making.
* **Instant Feedback Loop**: Interactive completion states provide immediate visual confirmation when tasks are finished.

## 🛠️ Technical Stack

This project was built with a **"Performance First"** approach, utilizing Vanilla JavaScript to manage state manually without the overhead of heavy frontend frameworks.

* **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+).
* **Backend**: Node.js, Express.js.
* **Database**: PostgreSQL (Relational Data Models).
* **Security**: JSON Web Tokens (JWT), bcrypt encryption, `sessionStorage` management.

## ⚙️ Installation & Setup

Prerequisites: Node.js and PostgreSQL installed locally.

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/task-manager.git](https://github.com/YOUR_USERNAME/task-manager.git)
    cd task-manager
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add your database credentials:
    ```env
    DB_USER=your_postgres_user
    DB_HOST=localhost
    DB_NAME=task_manager_db
    DB_PASSWORD=your_postgres_password
    DB_PORT=5432
    JWT_SECRET=your_secure_secret_key
    ```

4.  **Initialize Database**
    Run the SQL scripts provided in `database.sql` (or `db.js`) to create the necessary tables (Users, Clients, Tasks).

5.  **Run the Server**
    ```bash
    node server.js
    ```
    Access the app at `http://localhost:3000`.

## 🧩 Architecture

The application follows a clean MVC-style architecture:

* **`server.js`**: Entry point, configures Express and middleware.
* **`routes/`**: API endpoints for `auth`, `clients`, and `tasks`.
* **`public/js/`**: Frontend logic files (`dashboard.js`, `clients.js`) that handle DOM manipulation and API fetching.
* **`middleware/auth.js`**: "Gatekeeper" script that verifies JWT tokens before allowing access to protected routes.

## 🚧 Challenges & "Real Talk"

* **State Management**: Syncing the UI with the PostgreSQL database using only Vanilla JS required writing custom DOM-diffing logic to update the task list without refreshing the page.
* **Security Trade-offs**: I chose to use `sessionStorage` instead of `localStorage`. This means users must log in every time they open a new tab, but it guarantees higher security for financial data.

## 🔮 Future Roadmap

* [ ] Cloud Deployment (Vercel/Render).
* [ ] Mobile-responsive optimizations for the "Client Details" view.
* [ ] Add "Due Date" sorting to the main dashboard.

---

**Developer**: Martin Fakirov
