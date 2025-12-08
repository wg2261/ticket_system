from fastapi import APIRouter, HTTPException
from backend.db import get_connection
from datetime import datetime, timedelta

router = APIRouter(prefix="/flights", tags=["flights"])


# Search for upcoming flights by airport or city
@router.get("/search")
def search_flights(
    from_loc: str,
    to_loc: str,
    date: str | None = None,
    role: str = "customer",
    email: str | None = None
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Normalize inputs (case-insensitive)
        from_loc = from_loc.strip().lower()
        to_loc = to_loc.strip().lower()

        # Base search query: airport name OR city (case-insensitive)
        sql = """
            SELECT 
                F.flight_num,
                F.airline_name,
                F.airplane_id,
                F.departure_airport,
                F.arrival_airport,
                F.departure_time,
                F.arrival_time,
                F.status,
                F.price,
                A1.city AS depart_city,
                A2.city AS arrive_city
            FROM flight F
            JOIN airport A1 ON F.departure_airport = A1.name
            JOIN airport A2 ON F.arrival_airport = A2.name
            WHERE (
                LOWER(A1.name) LIKE %s OR LOWER(A1.city) LIKE %s
            )
              AND (
                LOWER(A2.name) LIKE %s OR LOWER(A2.city) LIKE %s
              )
              AND F.departure_time >= NOW()
        """

        params = [
            f"%{from_loc}%", f"%{from_loc}%",
            f"%{to_loc}%", f"%{to_loc}%"
        ]

        # Optional date filter
        if date:
            sql += " AND DATE(F.departure_time) = %s"
            params.append(date)

        # Agent restrictions
        if role == "agent" and email:
            sql += """
                AND F.airline_name IN (
                    SELECT airline_name 
                    FROM agent_airline_authorization
                    WHERE agent_email = %s
                )
            """
            params.append(email)

        # Staff restrictions
        if role == "staff" and email:
            sql += """
                AND F.airline_name = (
                    SELECT airline_name
                    FROM airline_staff
                    WHERE email = %s
                )
            """
            params.append(email)

        sql += " ORDER BY F.departure_time ASC"

        cursor.execute(sql, params)
        flights = cursor.fetchall()

        return {"results": flights}

    finally:
        cursor.close()
        conn.close()

# Search for flight status
@router.get("/status")
def get_flight_status(airline: str, flight_num: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
                airline_name,
                flight_num,
                airplane_id,
                departure_airport,
                arrival_airport,
                departure_time,
                arrival_time,
                status,
                price
            FROM flight
            WHERE airline_name = %s
              AND flight_num = %s
            """,
            (airline, flight_num)
        )

        flight = cursor.fetchone()

        if not flight:
            raise HTTPException(status_code=404, detail="Flight not found.")

        # Mark "in-progress" if current time is between departure & arrival
        now_query = """
            SELECT 
                CASE 
                    WHEN NOW() BETWEEN %s AND %s THEN 'in-progress'
                    ELSE 'scheduled'
                END AS live_status
        """

        cursor.execute(now_query, (flight["departure_time"], flight["arrival_time"]))
        live = cursor.fetchone()

        flight["live_status"] = live["live_status"]

        return flight

    finally:
        cursor.close()
        conn.close()
