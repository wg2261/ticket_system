from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import auth, flights, tickets
from .routes import agent, customer, staff

app = FastAPI()

# Allow React frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include route modules
app.include_router(auth.router)
app.include_router(flights.router)
app.include_router(tickets.router)
app.include_router(agent.router)
app.include_router(customer.router)
app.include_router(staff.router)

@app.get("/")
def home():
    return {"message": "FastAPI backend is running!"}
