from fastapi import APIRouter, HTTPException
import mysql
from pydantic import BaseModel
from backend.db import get_connection

import bcrypt
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Auth"])

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

# Customer
class CustomerRegister(BaseModel):
    email: str
    name: str
    password: str
    building_number: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    phone_number: Optional[str] = None
    passport_number: Optional[str] = None
    passport_expiration_date: Optional[str] = None
    passport_country: Optional[str] = None
    date_of_birth: Optional[str] = None

@router.post("/register/customer")
def register_customer(data: CustomerRegister):
    conn = get_connection()
    cursor = conn.cursor()

    # Hash password BEFORE storing
    hashed = hash_password(data.password)

    cursor.execute("""
        INSERT INTO customer (email, name, password, building_number, street, city, state,
                              phone_number, passport_number, passport_expiration_date, 
                              passport_country, date_of_birth)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        data.email,
        data.name,
        hashed,   # store hashed password
        data.building_number,
        data.street,
        data.city,
        data.state,
        data.phone_number,
        data.passport_number,
        data.passport_expiration_date,
        data.passport_country,
        data.date_of_birth,
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "role": "customer",
        "email": data.email,
        "name": data.name
    }


# Agent
class AgentRegister(BaseModel):
    email: str
    password: str

@router.post("/register/agent")
def register_agent(data: AgentRegister):
    conn = get_connection()
    cursor = conn.cursor()

    hashed = hash_password(data.password)

    cursor.execute("""
        INSERT INTO booking_agent (email, password)
        VALUES (%s, %s)
    """, (data.email, hashed))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "role": "agent",
        "email": data.email
    }


# Staff
class StaffRegister(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    date_of_birth: str
    airline_name: str
    permission: str

@router.post("/register/staff")
def register_staff(data: StaffRegister):
    conn = get_connection()
    cursor = conn.cursor()

    hashed = hash_password(data.password)

    try:
        cursor.execute("""
            INSERT INTO airline_staff (email, password, first_name, last_name, date_of_birth,
                                    airline_name, permission)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (data.email, hashed, data.first_name, data.last_name,
            data.date_of_birth, data.airline_name, data.permission))

        conn.commit()
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        if err.errno == 1452:
            raise HTTPException(
                status_code=400,
                detail=f"Airline '{data.airline_name}' does not exist."
            )
        else:
            raise HTTPException(status_code=500, detail="Database error occurred.")

    return {
        "role": "staff",
        "email": data.email,
        "airline_name": data.airline_name,
        "permission": data.permission
    }


# Check if email exists for the role to ensure unique
@router.get("/exists/{role}/{email}")
def email_exists(role: str, email: str):
    conn = get_connection()
    cursor = conn.cursor()

    table = {
        "customer": "customer",
        "agent": "booking_agent",
        "staff": "airline_staff"
    }.get(role)

    cursor.execute(f"SELECT 1 FROM {table} WHERE email=%s", (email,))
    exists = cursor.fetchone() is not None

    cursor.close()
    conn.close()

    return {"exists": exists}


# Login
class LoginRequest(BaseModel):
    email: str | None = None
    password: str
    role:str
    
@router.post("/login")
def login(data: LoginRequest):
    email = data.email
    password = data.password
    role = data.role

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    if role == "customer":
        cursor.execute("""
            SELECT email, name, password
            FROM customer
            WHERE email=%s
        """, (email,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="Account does not exist.")

        if not check_password(password, user["password"]):
            raise HTTPException(status_code=401, detail="Incorrect password.")

        return {
            "role": "customer",
            "email": user["email"],
            "name": user["name"]
        }

    # AGENT LOGIN
    if role == "agent":
        cursor.execute("""
            SELECT email, password
            FROM booking_agent
            WHERE email=%s
        """, (email,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="Account does not exist.")

        if not check_password(password, user["password"]):
            raise HTTPException(status_code=401, detail="Incorrect password.")

        return {
            "role": "agent",
            "email": user["email"]
        }

    # STAFF LOGIN
    if role == "staff":
        cursor.execute("""
            SELECT email, airline_name, permission, password
            FROM airline_staff
            WHERE email=%s
        """, (email,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="Account does not exist.")

        if not check_password(password, user["password"]):
            raise HTTPException(status_code=401, detail="Incorrect password.")

        return {
            "role": "staff",
            "email": user["email"],
            "airline_name": user["airline_name"],
            "permission": user["permission"]
        }

    raise HTTPException(status_code=400, detail="Invalid role.")

# Get airlines
@router.get("/airlines")
def get_airlines():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT name FROM airline")
    airlines = cursor.fetchall()

    cursor.close()
    conn.close()

    return {"airlines": [a["name"] for a in airlines]}
