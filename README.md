# 🛠️ How to Run the Project

## Backend (FastAPI)

### Start backend server
```bash
python -m uvicorn backend.main:app --reload --port 8080
```

Backend runs at:
```
http://localhost:8080
```

---

## Frontend (React)

### Install dependencies
```bash
npm install
```

### Start React development server
```bash
npm start
```

Frontend runs at:
```
http://localhost:3000
```

---

## Database Setup

### Create schema
```bash
mysql -u root -p < backend/create_table.sql
```

### (Optional except for airline) Insert sample data
```bash
mysql -u root -p < backend/insert.sql
```

Make sure your MySQL credentials in `backend/db.py` are correct.

---

# 📁 Project File Manifest

## 1. Root Directory

### `README.md`
Project overview and setup instructions.

### `package.json` / `package-lock.json`
Frontend dependencies and metadata.

### `.gitignore`
Ignore rules for version control.

---

## 2. Backend

### `backend/main.py`
FastAPI app entry point.

### `backend/db.py`
Database connection helper.

### `backend/create_table.sql`
Full SQL schema.

### `backend/insert.sql`
Database seed data.

### `backend/auth.py`
Authentication: login, logout, registration.

### `backend/customer.py`
Customer dashboard, flight search, ticket purchase, analytics.

### `backend/agent.py`
Booking agent functions: flight search, ticket purchase, analytics.

### `backend/staff.py`
Airline staff tools: analytics, customer flights, authorization, and managing flights, airplanes, airports.

### `backend/flights.py`
Public flight search and flight status.

### `backend/tickets.py`
Ticket creation, seat-class + capacity enforcement.

---

## 3. Frontend (`src/`)

### `src/App.js` / `src/App.css`
Main React wrapper and global UI.

### `src/api.js`
Axios backend wrapper.

### `src/index.js`
React app entry.

---

## 4. UI Components (`src/components/ui/`)

### `Navbar.js` / `Navbar.css`
Navigation bar.

### `Login.js` / `Login.css`
Login modal.

### `Register.js` / `Register.css`
Registration modal.

### `RegisterForm.js` / `RegisterForm.css`
Multi-step registration.

### `Flights.js` / `Flights.css`
Public flight search.

### `Purchase.js` / `Purchase.css`
Ticket purchase modal.

### `Sidebar.js` / `Sidebar.css`
Role-specific sidebar.

---

## 5. Customer Components (`src/components/customer/`)

### `Customer.js` / `Customer.css`
Customer dashboard.

### `CustomerFlights.js` / `CustomerFlights.css`
Customer flight search.

### `Spending.js` / `Spending.css`
Customer spending analytics.

---

## 6. Booking Agent Components (`src/components/agent/`)

### `Agent.js` / `Agent.css`
Agent dashboard.

### `AgentFlights.js` / `AgentFlights.css`
Authorized flight search.

### `AgentAnalytics.js` / `AgentAnalytics.css`
Commission + top customer analytics.

---

## 7. Staff Components (`src/components/staff/`)

### `Staff.js` / `Staff.css`
Airline staff dashboard.

### `Management.js` / `Management.css`
Staff tools: add airports, airplanes, and flights. 
Admin only: Authorize booking agents
Operator only: Updating flight.

### `StaffFlights.js` / `StaffFlights.css`
Airline flights + customer tickets lookup.

### `StaffAnalytics.js` / `StaffAnalytics.css`
Analytics:
- tickets/month  
- top agents (tickets + commission)  
- top destinations  
- flight delay stats  
- frequent customers  

---

# 📄 Feature → Database Query Mapping

## Auth

### `POST /auth/register/customer`
Creates a new customer record in the database.

### `POST /auth/register/agent`
Creates a new booking agent in the database.

### `POST /auth/register/staff`
Creates a new airline staff member.

### `GET /auth/exists/{role}/{email}`
Checks if a user email already exists in the specified table.

### `POST /auth/login`
Verifies credentials and retrieves the matching user record.

### `GET /auth/airlines`
Returns all airlines from the `airline` table.

---

## Tickets

### `POST /tickets/purchase`
Creates a new ticket and purchase entry after validating capacity.

### `GET /tickets/sold/{airline}/{flight_num}/{seat_class}`
Counts how many tickets were sold for a specific flight and seat class.

---

## Agent

### `GET /agent/dashboard/{email}`
Retrieves all tickets purchased through this agent.

### `GET /agent/flights/{email}`
Returns flights the agent is allowed to book (via authorization table).

### `GET /agent/analytics/{email}`
Aggregates total commissions, ticket counts, and top customers.

---

## Staff

### `GET /staff/dashboard/{email}`
Loads staff airline summary: upcoming flights, delays, top customers.

### `GET /staff/flights/{email}`
Returns flights for the staff’s airline with optional filters.

### `GET /staff/analytics/{email}`
Runs analytics queries: ticket sales, top agents, destinations, status stats.

### `POST /staff/add_airport`
Inserts a new airport into the `airport` table.

### `POST /staff/add_airplane`
Adds an airplane and its seat classes.

### `POST /staff/create_flight`
Inserts a new flight into the `flight` table.

### `POST /staff/authorize_agent`
Adds an authorization entry linking agent to airline.

### `POST /staff/update_flight_status`
Updates the `status` field of a specific flight.

### `GET /staff/get_airplanes/{airline}`
Retrieves all airplanes owned by the specified airline.

### `GET /staff/get_seat_classes/{airline}/{airplane_id}`
Returns all seat classes for a given airplane.
