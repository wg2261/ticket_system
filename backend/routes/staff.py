from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from backend.db import get_connection

router = APIRouter(prefix="/staff", tags=["staff"])

def db_error(e):
    """Convert SQL errors into readable messages."""
    msg = str(e)

    # Duplicate key (airport, airplane, flight, etc.)
    if "Duplicate" in msg or "duplicate" in msg:
        return "This entry already exists."

    # Foreign key failure
    if "foreign key" in msg.lower():
        return "Invalid reference. Make sure related records exist."

    # Missing column or SQL syntax (developer mistake)
    if "Unknown column" in msg or "syntax" in msg:
        return "Internal database error. Please contact admin."

    # Fallback: safe generic message
    return msg

# Gets for dashboard page
@router.get("/dashboard/{email}")
def staff_dashboard(email: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # -------------------------------------
        # Validate staff account
        # -------------------------------------
        cursor.execute(
            "SELECT airline_name, first_name FROM airline_staff WHERE email=%s",
            (email,)
        )
        staff = cursor.fetchone()

        if not staff:
            raise HTTPException(404, detail="No staff account found for this email.")

        airline = staff["airline_name"]

        now = datetime.now()
        next_30 = now + timedelta(days=30)
        last_30 = now - timedelta(days=30)
        last_12 = now - timedelta(days=365)

        # -------------------------------------
        # Upcoming flights (next 30 days)
        # -------------------------------------
        cursor.execute(
            """
            SELECT COUNT(*) AS c
            FROM flight
            WHERE airline_name=%s
              AND departure_time BETWEEN %s AND %s
            """,
            (airline, now, next_30)
        )
        upcoming_count = cursor.fetchone()["c"] or 0

        # -------------------------------------
        # Performance summary
        # -------------------------------------
        cursor.execute(
            "SELECT COUNT(*) AS c FROM flight WHERE airline_name=%s AND status='on-time'",
            (airline,)
        )
        on_time = cursor.fetchone()["c"] or 0

        cursor.execute(
            "SELECT COUNT(*) AS c FROM flight WHERE airline_name=%s AND status='delayed'",
            (airline,)
        )
        delayed = cursor.fetchone()["c"] or 0

        cursor.execute(
            "SELECT COUNT(*) AS c FROM flight WHERE airline_name=%s",
            (airline,)
        )
        total = cursor.fetchone()["c"] or 0

        performance = {
            "on_time": on_time,
            "delayed": delayed,
            "total": total
        }

        # -------------------------------------
        # Most frequent customer (past 12 months)
        # -------------------------------------
        cursor.execute(
            """
            SELECT 
                P.customer_email,
                COUNT(*) AS trips
            FROM purchase P
            JOIN ticket T ON P.ticket_id = T.ticket_id
            JOIN flight F ON T.flight_num = F.flight_num
            WHERE F.airline_name=%s
              AND P.purchase_date >= %s
            GROUP BY P.customer_email
            ORDER BY trips DESC
            LIMIT 1
            """,
            (airline, last_12)
        )
        frequent_customer = cursor.fetchone() or {"customer_email": None, "trips": 0}

        # -------------------------------------
        # Top booking agent (past 30 days)
        # -------------------------------------
        cursor.execute(
            """
            SELECT 
                P.agent_email,
                COUNT(*) AS sold
            FROM purchase P
            JOIN ticket T ON P.ticket_id = T.ticket_id
            JOIN flight F ON T.flight_num = F.flight_num
            WHERE F.airline_name=%s
              AND P.agent_email IS NOT NULL
              AND P.purchase_date >= %s
            GROUP BY agent_email
            ORDER BY sold DESC
            LIMIT 1
            """,
            (airline, last_30)
        )
        top_agent = cursor.fetchone() or {"agent_email": None, "sold": 0}

        # -------------------------------------
        # Ticket sales grouped by month
        # -------------------------------------
        cursor.execute(
            """
            SELECT 
                DATE_FORMAT(P.purchase_date, '%%Y-%%m') AS month,
                COUNT(*) AS tickets
            FROM purchase P
            JOIN ticket T ON P.ticket_id = T.ticket_id
            JOIN flight F ON T.flight_num = F.flight_num
            WHERE F.airline_name=%s
            GROUP BY month
            ORDER BY month ASC
            """,
            (airline,)
        )
        monthly_sales = cursor.fetchall() or []

        # -------------------------------------
        # FINAL RETURN PAYLOAD
        # -------------------------------------
        return {
            "success": True,
            "airline": airline,
            "upcoming_count": upcoming_count,
            "performance": performance,
            "frequent_customer": frequent_customer,
            "top_agent": top_agent,
            "monthly_sales": monthly_sales,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(400, detail="Failed to load dashboard information.")

    finally:
        cursor.close()
        conn.close()

# Gets for flights page
@router.get("/flights/{email}")
def staff_flights(
    email: str,
    from_loc: str | None = None,
    to_loc: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Identify staff airline
        cursor.execute(
            "SELECT airline_name FROM airline_staff WHERE email=%s",
            (email,)
        )
        staff = cursor.fetchone()

        if not staff:
            raise HTTPException(404, "Staff account not found.")

        airline = staff["airline_name"]

        now = datetime.now()
        next_30 = now + timedelta(days=30)
        filters_used = any([from_loc, to_loc, date_from, date_to])

        # ------------------------------------------------------
        # JOIN airport (airport.name = airport code)
        # ------------------------------------------------------
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
                A1.city AS depart_city,
                A2.city AS arrive_city
            FROM flight F
            JOIN airport A1 ON F.departure_airport = A1.name
            JOIN airport A2 ON F.arrival_airport = A2.name
            WHERE F.airline_name = %s
        """

        params = [airline]

        # ------------------------------------------------------
        # Default: next 30 days
        # ------------------------------------------------------
        if not filters_used:
            sql += " AND F.departure_time BETWEEN %s AND %s"
            params += [now, next_30]

        # ------------------------------------------------------
        # FROM fuzzy search (case-insensitive)
        # Matches NRT, nrt, Tokyo, tokyo, etc.
        # ------------------------------------------------------
        if from_loc:
            t = f"%{from_loc.lower()}%"
            sql += """
                AND (
                    LOWER(A1.name) LIKE %s OR
                    LOWER(A1.city) LIKE %s
                )
            """
            params += [t, t]

        # ------------------------------------------------------
        # TO fuzzy search (case-insensitive)
        # Matches PVG, SHA, Shanghai, shanghai, etc.
        # ------------------------------------------------------
        if to_loc:
            t = f"%{to_loc.lower()}%"
            sql += """
                AND (
                    LOWER(A2.name) LIKE %s OR
                    LOWER(A2.city) LIKE %s
                )
            """
            params += [t, t]

        # ------------------------------------------------------
        # Optional date range
        # ------------------------------------------------------
        if date_from:
            sql += " AND DATE(F.departure_time) >= %s"
            params.append(date_from)

        if date_to:
            sql += " AND DATE(F.departure_time) <= %s"
            params.append(date_to)

        sql += " ORDER BY F.departure_time ASC"

        cursor.execute(sql, params)
        flights = cursor.fetchall() or []

        return {
            "success": True,
            "airline": airline,
            "filters_used": filters_used,
            "count": len(flights),
            "flights": flights
        }

    finally:
        cursor.close()
        conn.close()


# Gets for analytics page
@router.get("/analytics/{email}")
def staff_analytics(email: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Validate staff
        cursor.execute(
            "SELECT airline_name FROM airline_staff WHERE email=%s",
            (email,)
        )
        staff = cursor.fetchone()

        if not staff:
            raise HTTPException(404, "Staff not found.")

        airline = staff["airline_name"]

        now = datetime.now()
        last_month = now - timedelta(days=30)
        last_year = now - timedelta(days=365)
        last_3mo = now - timedelta(days=90)

        # ----------------------------------------------------
        # TOTAL FLIGHTS
        # ----------------------------------------------------
        cursor.execute(
            "SELECT COUNT(*) AS total_flights FROM flight WHERE airline_name=%s",
            (airline,)
        )
        total_flights = cursor.fetchone()["total_flights"]

        # ----------------------------------------------------
        # TICKETS SOLD PER MONTH  (MONTH NAME ONLY)
        # ----------------------------------------------------
        cursor.execute(
            """
            SELECT 
                DATE_FORMAT(P.purchase_date, '%%b') AS month,
                COUNT(*) AS tickets
            FROM purchase P
            JOIN ticket T ON P.ticket_id=T.ticket_id
            JOIN flight F ON T.flight_num=F.flight_num
            WHERE F.airline_name=%s
            GROUP BY month
            ORDER BY MIN(P.purchase_date)
            """,
            (airline,)
        )
        ticket_monthly = cursor.fetchall() or []

        # ----------------------------------------------------
        # FREQUENT CUSTOMER (past year)
        # ----------------------------------------------------
        cursor.execute(
            """
            SELECT 
                P.customer_email,
                COUNT(*) AS flights
            FROM purchase P
            JOIN ticket T ON P.ticket_id=T.ticket_id
            JOIN flight F ON T.flight_num=F.flight_num
            WHERE F.airline_name=%s
              AND P.purchase_date >= %s
            GROUP BY P.customer_email
            ORDER BY flights DESC
            LIMIT 1
            """,
            (airline, last_year)
        )
        freq_customer = cursor.fetchone() or {"customer_email": None, "flights": 0}

        # ----------------------------------------------------
        # STATUS STATS
        # ----------------------------------------------------
        cursor.execute(
            "SELECT COUNT(*) AS c FROM flight WHERE airline_name=%s AND status='delayed'",
            (airline,)
        )
        delayed = cursor.fetchone()["c"]

        cursor.execute(
            "SELECT COUNT(*) AS c FROM flight WHERE airline_name=%s",
            (airline,)
        )
        total = cursor.fetchone()["c"]

        on_time = total - delayed

        status_stats = {
            "on_time": on_time,
            "delayed": delayed,
            "total": total
        }

        # ----------------------------------------------------
        # TOP AGENTS — LAST MONTH (tickets + commission)
        # ----------------------------------------------------
        cursor.execute(
            """
            SELECT 
                P.agent_email,
                COUNT(*) AS sold,
                SUM(T.price_charged * 0.10) AS commission
            FROM purchase P
            JOIN ticket T ON P.ticket_id=T.ticket_id
            JOIN flight F ON T.flight_num=F.flight_num
            WHERE F.airline_name=%s
              AND P.agent_email IS NOT NULL
              AND P.purchase_date >= %s
            GROUP BY P.agent_email
            ORDER BY sold DESC
            LIMIT 5
            """,
            (airline, last_month)
        )
        top_agents_month = cursor.fetchall() or []

        # ----------------------------------------------------
        # TOP AGENTS — LAST YEAR (tickets + commission)
        # ----------------------------------------------------
        cursor.execute(
            """
            SELECT 
                P.agent_email,
                COUNT(*) AS sold,
                SUM(T.price_charged * 0.10) AS commission
            FROM purchase P
            JOIN ticket T ON P.ticket_id=T.ticket_id
            JOIN flight F ON T.flight_num=F.flight_num
            WHERE F.airline_name=%s
              AND P.agent_email IS NOT NULL
              AND P.purchase_date >= %s
            GROUP BY P.agent_email
            ORDER BY sold DESC
            LIMIT 5
            """,
            (airline, last_year)
        )
        top_agents_year = cursor.fetchall() or []

        # ----------------------------------------------------
        # TOP DESTINATIONS — LAST 3 MONTHS (CITY)
        # ----------------------------------------------------
        cursor.execute(
            """
            SELECT 
                A2.city AS destination,
                COUNT(*) AS count
            FROM ticket T
            JOIN flight F ON T.flight_num=F.flight_num
            JOIN purchase P ON T.ticket_id=P.ticket_id
            JOIN airport A2 ON F.arrival_airport = A2.name
            WHERE F.airline_name=%s
              AND P.purchase_date >= %s
            GROUP BY destination
            ORDER BY count DESC
            LIMIT 5
            """,
            (airline, last_3mo)
        )
        top_dest_3mo = cursor.fetchall() or []

        # ----------------------------------------------------
        # TOP DESTINATIONS — LAST YEAR (CITY)
        # ----------------------------------------------------
        cursor.execute(
            """
            SELECT 
                A2.city AS destination,
                COUNT(*) AS count
            FROM ticket T
            JOIN flight F ON T.flight_num=F.flight_num
            JOIN purchase P ON T.ticket_id=P.ticket_id
            JOIN airport A2 ON F.arrival_airport = A2.name
            WHERE F.airline_name=%s
              AND P.purchase_date >= %s
            GROUP BY destination
            ORDER BY count DESC
            LIMIT 5
            """,
            (airline, last_year)
        )
        top_dest_year = cursor.fetchall() or []

        # ----------------------------------------------------
        # FINAL RETURN
        # ----------------------------------------------------
        return {
            "success": True,
            "airline": airline,
            "total_flights": total_flights,
            "ticket_monthly": ticket_monthly,
            "freq_customer": freq_customer,
            "status_stats": status_stats,
            "top_agents_month": top_agents_month,
            "top_agents_year": top_agents_year,
            "top_dest_3mo": top_dest_3mo,
            "top_dest_year": top_dest_year
        }

    finally:
        cursor.close()
        conn.close()


# Add airport
@router.post("/add_airport")
def add_airport(data: dict):
    name = (data.get("name") or "").strip()
    city = (data.get("city") or "").strip()

    # Validate input
    if not name:
        raise HTTPException(400, detail="Airport name is required.")
    if not city:
        raise HTTPException(400, detail="Airport city is required.")

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO airport (name, city) VALUES (%s, %s)",
            (name, city)
        )
        conn.commit()

        return {
            "success": True,
            "message": "Airport added successfully.",
            "data": {"name": name, "city": city}
        }

    except Exception as e:
        raise HTTPException(400, detail=db_error(e))

    finally:
        cursor.close()
        conn.close()

# Add airplane and seat classes
@router.post("/add_airplane")
def add_airplane(data: dict):
    airplane_id = (data.get("airplane_id") or "").strip()
    airline_name = (data.get("airline_name") or "").strip()
    seat_classes = data.get("seat_classes", [])

    # -----------------------
    # VALIDATION
    # -----------------------
    if not airplane_id:
        raise HTTPException(400, detail="Airplane ID is required.")

    if not airline_name:
        raise HTTPException(400, detail="Airline name is required.")

    if not isinstance(seat_classes, list) or len(seat_classes) == 0:
        raise HTTPException(400, detail="At least one seat class must be provided.")

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # -----------------------
        # INSERT AIRPLANE
        # -----------------------
        cursor.execute(
            """
            INSERT INTO airplane (airplane_id, airline_name)
            VALUES (%s, %s)
            """,
            (airplane_id, airline_name)
        )

        # -----------------------
        # INSERT SEAT CLASSES
        # -----------------------
        for idx, sc in enumerate(seat_classes, start=1):
            class_name = (sc.get("class") or "").strip()
            capacity = sc.get("capacity")
            price_factor = sc.get("price_factor")

            # Validations
            if not class_name:
                raise HTTPException(
                    400, 
                    detail=f"Seat class #{idx}: Class name is required."
                )

            try:
                capacity = int(capacity)
                price_factor = float(price_factor)
            except:
                raise HTTPException(
                    400,
                    detail=f"Seat class '{class_name}': Capacity must be an integer and price factor must be a number."
                )

            if capacity <= 0:
                raise HTTPException(
                    400,
                    detail=f"Seat class '{class_name}': Capacity must be greater than 0."
                )

            if price_factor <= 0:
                raise HTTPException(
                    400,
                    detail=f"Seat class '{class_name}': Price factor must be greater than 0."
                )

            cursor.execute(
                """
                INSERT INTO seat_class (class, airplane_id, airline_name, capacity, price_factor)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (class_name, airplane_id, airline_name, capacity, price_factor)
            )

        conn.commit()

        return {
            "success": True,
            "message": "Airplane and seat classes created successfully.",
            "data": {
                "airplane_id": airplane_id,
                "airline_name": airline_name,
                "seat_classes": seat_classes
            }
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(400, detail=db_error(e))

    finally:
        cursor.close()
        conn.close()

# Create flight
@router.post("/create_flight")
def create_flight(data: dict):
    flight_num = (data.get("flight_num") or "").strip()
    airline_name = (data.get("airline_name") or "").strip()
    from_airport = (data.get("from_airport") or "").strip()
    to_airport = (data.get("to_airport") or "").strip()
    departure_time = data.get("departure_time")
    arrival_time = data.get("arrival_time")
    airplane_id = (data.get("airplane_id") or "").strip()

    # -----------------------
    # BASIC VALIDATION
    # -----------------------
    if not flight_num:
        raise HTTPException(400, detail="Flight number is required.")
    if not airline_name:
        raise HTTPException(400, detail="Airline name is required.")
    if not from_airport:
        raise HTTPException(400, detail="Departure airport is required.")
    if not to_airport:
        raise HTTPException(400, detail="Arrival airport is required.")
    if not airplane_id:
        raise HTTPException(400, detail="Airplane ID is required.")
    if not departure_time or not arrival_time:
        raise HTTPException(400, detail="Departure and arrival times are required.")

    # Parse and validate datetime format
    try:
        dt_depart = datetime.fromisoformat(departure_time)
        dt_arrive = datetime.fromisoformat(arrival_time)
    except:
        raise HTTPException(400, detail="Invalid date format. Use ISO 'YYYY-MM-DD HH:MM'.")

    if dt_arrive <= dt_depart:
        raise HTTPException(400, detail="Arrival time must be later than departure time.")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # --------------------------------------------
        # 1️⃣ Confirm airplane exists
        # --------------------------------------------
        cursor.execute(
            """
            SELECT airplane_id 
            FROM airplane
            WHERE airline_name=%s AND airplane_id=%s
            """,
            (airline_name, airplane_id)
        )
        airplane = cursor.fetchone()

        if not airplane:
            raise HTTPException(
                400,
                detail="The selected airplane does not belong to this airline or does not exist."
            )

        # --------------------------------------------
        # 2️⃣ Ensure airplane has at least ONE seat class
        # --------------------------------------------
        cursor.execute(
            """
            SELECT COUNT(*) AS c
            FROM seat_class
            WHERE airline_name=%s AND airplane_id=%s
            """,
            (airline_name, airplane_id)
        )
        sc_count = cursor.fetchone()["c"]

        if sc_count == 0:
            raise HTTPException(
                400,
                detail="This airplane has no seat classes. Add seat classes under 'Add Airplane' before creating flights."
            )

        # --------------------------------------------
        # 3️⃣ Check for duplicate flight number
        # --------------------------------------------
        cursor.execute(
            """
            SELECT 1 FROM flight
            WHERE airline_name=%s AND flight_num=%s
            """,
            (airline_name, flight_num)
        )
        if cursor.fetchone():
            raise HTTPException(
                400,
                detail=f"Flight number '{flight_num}' already exists for {airline_name}."
            )

        # --------------------------------------------
        # 4️⃣ Insert flight
        # --------------------------------------------
        cursor.execute(
            """
            INSERT INTO flight 
                (flight_num, airline_name, airplane_id, 
                 departure_airport, departure_time, 
                 arrival_airport, arrival_time, status, price)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'upcoming', 100)
            """,
            (
                flight_num, airline_name, airplane_id,
                from_airport, departure_time,
                to_airport, arrival_time
            )
        )

        conn.commit()
        return {
            "success": True,
            "message": "Flight created successfully.",
            "data": {
                "flight_num": flight_num,
                "airline_name": airline_name,
                "airplane_id": airplane_id
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(400, detail=db_error(e))

    finally:
        cursor.close()
        conn.close()

@router.post("/authorize_agent")
def authorize_agent(data: dict):
    agent_email = data.get("agent_email")
    airline_name = data.get("airline_name")

    if not agent_email or not airline_name:
        raise HTTPException(status_code=400, detail="Missing authorization fields.")

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO agent_airline_authorization (agent_email, airline_name) VALUES (%s, %s)",
            (agent_email, airline_name)
        )
        conn.commit()
        return {"message": "Agent authorized successfully."}

    except Exception as e:
        raise HTTPException(400, detail=db_error(e))

    finally:
        cursor.close()
        conn.close()

# Update flight status
@router.post("/update_flight_status")
def update_flight_status(data: dict):
    flight_num = (data.get("flight_num") or "").strip()
    airline_name = (data.get("airline_name") or "").strip()
    status = (data.get("status") or "").strip()

    # -----------------------------------
    # VALIDATION
    # -----------------------------------
    allowed_status = {"upcoming", "in-progress", "delayed"}

    if not flight_num:
        raise HTTPException(400, detail="Flight number is required.")
    if not airline_name:
        raise HTTPException(400, detail="Airline name is required.")
    if not status:
        raise HTTPException(400, detail="Status is required.")
    if status not in allowed_status:
        raise HTTPException(400, detail=f"Invalid status. Allowed: {', '.join(allowed_status)}.")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # -----------------------------------
        # Confirm flight exists AND belongs to airline
        # -----------------------------------
        cursor.execute(
            """
            SELECT 1 FROM flight
            WHERE flight_num=%s AND airline_name=%s
            """,
            (flight_num, airline_name)
        )
        flight = cursor.fetchone()

        if not flight:
            raise HTTPException(
                404,
                detail=f"Flight '{flight_num}' not found for airline '{airline_name}'."
            )

        # -----------------------------------
        # Update the flight status
        # -----------------------------------
        cursor.execute(
            """
            UPDATE flight
            SET status=%s
            WHERE flight_num=%s AND airline_name=%s
            """,
            (status, flight_num, airline_name)
        )
        conn.commit()

        return {
            "success": True,
            "message": f"Flight {flight_num} status updated to '{status}'.",
            "data": {"flight_num": flight_num, "status": status}
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(400, detail=db_error(e))

    finally:
        cursor.close()
        conn.close()

# Authorize agent
@router.post("/authorize_agent")
def authorize_agent(data: dict):
    agent_email = (data.get("agent_email") or "").strip()
    airline_name = (data.get("airline_name") or "").strip()

    if not agent_email:
        raise HTTPException(400, detail="Agent email is required.")
    if not airline_name:
        raise HTTPException(400, detail="Airline name is required.")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # --------------------------------------------
        # 1️⃣ Verify agent exists
        # --------------------------------------------
        cursor.execute(
            "SELECT email FROM booking_agent WHERE email=%s",
            (agent_email,)
        )
        agent = cursor.fetchone()

        if not agent:
            raise HTTPException(
                400,
                detail=f"No agent account found with email '{agent_email}'."
            )

        # --------------------------------------------
        # 2️⃣ Check if already authorized
        # --------------------------------------------
        cursor.execute(
            """
            SELECT 1 FROM agent_airline_authorization
            WHERE agent_email=%s AND airline_name=%s
            """,
            (agent_email, airline_name)
        )
        if cursor.fetchone():
            raise HTTPException(
                400,
                detail=f"Agent '{agent_email}' is already authorized for {airline_name}."
            )

        # --------------------------------------------
        # 3️⃣ Insert authorization
        # --------------------------------------------
        cursor.execute(
            """
            INSERT INTO agent_airline_authorization (agent_email, airline_name)
            VALUES (%s, %s)
            """,
            (agent_email, airline_name)
        )
        conn.commit()

        return {
            "success": True,
            "message": f"Agent '{agent_email}' is now authorized for {airline_name}.",
            "data": {"agent_email": agent_email}
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(400, detail=db_error(e))

    finally:
        cursor.close()
        conn.close()

# Get airplanes
@router.get("/get_airplanes/{airline}")
def get_airplanes(airline: str):
    airline = (airline or "").strip()

    if not airline:
        raise HTTPException(400, detail="Airline name is required.")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT airplane_id FROM airplane WHERE airline_name=%s",
            (airline,)
        )
        airplanes = cursor.fetchall() or []

        return {
            "success": True,
            "airline": airline,
            "airplanes": airplanes
        }

    except Exception as e:
        raise HTTPException(400, detail=db_error(e))

    finally:
        cursor.close()
        conn.close()

# Get seat classes
@router.get("/get_seat_classes/{airline}/{airplane_id}")
def get_seat_classes(airline: str, airplane_id: str):
    airline = (airline or "").strip()
    airplane_id = (airplane_id or "").strip()

    if not airline:
        raise HTTPException(400, detail="Airline name is required.")
    if not airplane_id:
        raise HTTPException(400, detail="Airplane ID is required.")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # -----------------------------
        # Confirm airplane exists
        # -----------------------------
        cursor.execute(
            """
            SELECT 1 FROM airplane
            WHERE airline_name=%s AND airplane_id=%s
            """,
            (airline, airplane_id)
        )
        existing = cursor.fetchone()

        if not existing:
            raise HTTPException(
                404,
                detail=f"Airplane '{airplane_id}' does not exist for airline '{airline}'."
            )

        # -----------------------------
        # Fetch seat classes
        # -----------------------------
        cursor.execute(
            """
            SELECT class, capacity, price_factor
            FROM seat_class
            WHERE airline_name=%s AND airplane_id=%s
            """,
            (airline, airplane_id)
        )
        classes = cursor.fetchall() or []

        return {
            "success": True,
            "airline": airline,
            "airplane_id": airplane_id,
            "classes": classes
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(400, detail=db_error(e))

    finally:
        cursor.close()
        conn.close()

