from fastapi import APIRouter, HTTPException
from backend.db import get_connection

router = APIRouter(prefix="/tickets", tags=["Tickets"])

@router.post("/purchase")
def purchase_ticket(data: dict):
    customer_email = data.get("customer_email")
    agent_email = data.get("agent_email")
    airline_name = data.get("airline_name")
    flight_num = data.get("flight_num")
    seat_class = data.get("seat_class")

    if not all([customer_email, airline_name, flight_num, seat_class]):
        raise HTTPException(status_code=400, detail="Missing purchase fields.")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1️⃣ Load flight + airplane
        cursor.execute(
            """
            SELECT airplane_id, price
            FROM flight
            WHERE airline_name=%s AND flight_num=%s
            """,
            (airline_name, flight_num)
        )
        flight = cursor.fetchone()

        if not flight:
            raise HTTPException(404, detail="Flight not found.")

        airplane_id = flight["airplane_id"]
        base_price = float(flight["price"])

        # 2️⃣ Seat class validation
        cursor.execute(
            """
            SELECT capacity, price_factor
            FROM seat_class
            WHERE airline_name=%s AND airplane_id=%s AND class=%s
            """,
            (airline_name, airplane_id, seat_class)
        )
        sc = cursor.fetchone()

        if not sc:
            raise HTTPException(400, detail="Seat class not available for this airplane.")

        capacity = sc["capacity"]
        price_factor = float(sc["price_factor"])

        # 3️⃣ Seats sold
        cursor.execute(
            """
            SELECT COUNT(*) AS sold
            FROM ticket
            WHERE airline_name=%s AND flight_num=%s AND seat_class=%s
            """,
            (airline_name, flight_num, seat_class)
        )
        sold = cursor.fetchone()["sold"]

        if sold >= capacity:
            raise HTTPException(400, detail=f"{seat_class} is sold out.")

        # 4️⃣ Final price
        final_price = round(base_price * price_factor, 2)

        # 5️⃣ Create ticket (NOW includes price)
        cursor.execute(
            """
            INSERT INTO ticket (seat_class, airplane_id, flight_num, airline_name, price_charged)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (seat_class, airplane_id, flight_num, airline_name, final_price)
        )

        ticket_id = cursor.lastrowid

        # 6️⃣ Purchase record
        cursor.execute(
            """
            INSERT INTO purchase (ticket_id, customer_email, agent_email, purchase_date)
            VALUES (%s, %s, %s, CURDATE())
            """,
            (ticket_id, customer_email, agent_email)
        )

        conn.commit()
        return {
            "message": "Ticket purchased successfully.",
            "ticket_id": ticket_id,
            "price_charged": final_price
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(400, detail=str(e))

    finally:
        cursor.close()
        conn.close()

@router.get("/sold/{airline}/{flight_num}/{seat_class}")
def get_tickets_sold(airline: str, flight_num: str, seat_class: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1️⃣ Validate flight exists
        cursor.execute(
            """
            SELECT airplane_id 
            FROM flight
            WHERE airline_name=%s AND flight_num=%s
            """,
            (airline, flight_num)
        )
        flight = cursor.fetchone()

        if not flight:
            raise HTTPException(
                status_code=404,
                detail="Flight not found for this airline."
            )

        airplane_id = flight["airplane_id"]

        # 2️⃣ Validate seat class exists for this airplane
        cursor.execute(
            """
            SELECT capacity
            FROM seat_class
            WHERE airline_name=%s AND airplane_id=%s AND class=%s
            """,
            (airline, airplane_id, seat_class)
        )
        sc = cursor.fetchone()

        if not sc:
            raise HTTPException(
                status_code=400,
                detail="Seat class not available for this airplane."
            )

        capacity = sc["capacity"]

        # 3️⃣ Count tickets sold for this class
        cursor.execute(
            """
            SELECT COUNT(*) AS sold
            FROM ticket
            WHERE airline_name=%s
              AND flight_num=%s
              AND seat_class=%s
            """,
            (airline, flight_num, seat_class)
        )
        sold = cursor.fetchone()["sold"]

        # 4️⃣ Return a clean payload
        return {
            "airline": airline,
            "flight_num": flight_num,
            "seat_class": seat_class,
            "sold": sold,
            "capacity": capacity,
            "remaining": max(capacity - sold, 0)
        }

    finally:
        cursor.close()
        conn.close()
