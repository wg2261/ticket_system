from fastapi import APIRouter, HTTPException
from backend.db import get_connection
from datetime import datetime, timedelta

router = APIRouter(prefix="/customer", tags=["customer"])


# For customer dashboard display
@router.get("/dashboard/{email}")
def customer_dashboard(email: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Get next upcoming and last purchase
    cursor.execute("""
        SELECT 
            F.flight_num,
            F.airline_name,
            F.departure_airport,
            F.arrival_airport,
            F.departure_time,
            F.arrival_time,
            F.status,
            T.seat_class,
            T.price_charged,
            P.purchase_date
        FROM purchase P
        JOIN ticket T ON P.ticket_id = T.ticket_id
        JOIN flight F ON T.flight_num = F.flight_num
        WHERE P.customer_email = %s
    """, (email,))

    all_flights = cursor.fetchall()

    from datetime import datetime
    now = datetime.now()

    upcoming = [f for f in all_flights if f["departure_time"] >= now]
    past = sorted(
        [f for f in all_flights if f["departure_time"] < now],
        key=lambda x: x["departure_time"],
        reverse=True
    )

    next_upcoming = upcoming[0] if upcoming else None
    last_purchase = past[0]["purchase_date"] if past else None

    # Past 12 months spending
    cursor.execute("""
        SELECT SUM(T.price_charged) AS total
        FROM purchase P
        JOIN ticket T ON P.ticket_id = T.ticket_id
        WHERE P.customer_email = %s
          AND P.purchase_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    """, (email,))
    spending12 = cursor.fetchone()["total"] or 0

    cursor.close()
    conn.close()

    return {
        "next_upcoming": next_upcoming,
        "total_spending_12mo": float(spending12),
        "total_tickets": len(all_flights),
        "upcoming_count": len(upcoming),
        "last_purchase": last_purchase
    }


# Get spending for my spending page
@router.get("/spending/{email}")
def get_customer_spending(
    email: str,
    start: str = None,
    end: str = None
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # If user provides date range, convert them to datetime
    start_date = datetime.fromisoformat(start) if start else None
    end_date = datetime.fromisoformat(end) if end else None

    # If no custom range → last 12 months
    if not start_date or not end_date:
        end_date = datetime.today()
        start_date = end_date - timedelta(days=365)

    # Total spending in range
    cursor.execute("""
        SELECT SUM(T.price_charged) AS total
        FROM purchase P
        JOIN ticket T ON P.ticket_id = T.ticket_id
        WHERE P.customer_email = %s
          AND P.purchase_date BETWEEN %s AND %s
    """, (email, start_date, end_date))

    total = cursor.fetchone()["total"] or 0

    # Monthly spending for last 12 months
    cursor.execute("""
        SELECT 
            DATE_FORMAT(P.purchase_date, '%Y-%m') AS month,
            SUM(T.price_charged) AS total
        FROM purchase P
        JOIN ticket T ON P.ticket_id = T.ticket_id
        WHERE P.customer_email = %s
          AND P.purchase_date BETWEEN %s AND %s
        GROUP BY month
        ORDER BY month ASC
    """, (email, start_date, end_date))

    monthly = cursor.fetchall()

    cursor.close()
    conn.close()

    return {
        "email": email,
        "start": start_date,
        "end": end_date,
        "last12Months": float(total),
        "monthly": monthly
    }

# Get flights for my flights page
@router.get("/flights/{email}")
def get_customer_flights(email: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    now = datetime.now()

    # Upcoming flights
    cursor.execute("""
        SELECT 
            F.flight_num,
            F.airline_name,
            F.departure_airport,
            F.arrival_airport,
            F.departure_time,
            F.arrival_time,
            F.status,
            T.seat_class,
            T.price_charged,
            P.purchase_date
        FROM purchase P
        JOIN ticket T ON P.ticket_id = T.ticket_id
        JOIN flight F ON T.flight_num = F.flight_num
        WHERE P.customer_email = %s
          AND F.departure_time >= %s
        ORDER BY F.departure_time ASC
    """, (email, now))

    upcoming = cursor.fetchall()

    # Past flights
    cursor.execute("""
        SELECT 
            F.flight_num,
            F.airline_name,
            F.departure_airport,
            F.arrival_airport,
            F.departure_time,
            F.arrival_time,
            F.status,
            T.seat_class,
            T.price_charged,
            P.purchase_date
        FROM purchase P
        JOIN ticket T ON P.ticket_id = T.ticket_id
        JOIN flight F ON T.flight_num = F.flight_num
        WHERE P.customer_email = %s
          AND F.departure_time < %s
        ORDER BY F.departure_time DESC
    """, (email, now))

    past = cursor.fetchall()

    cursor.close()
    conn.close()

    return {
        "upcoming": upcoming,
        "past": past
    }