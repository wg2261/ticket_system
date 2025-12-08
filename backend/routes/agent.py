from fastapi import APIRouter, HTTPException
from backend.db import get_connection
from datetime import datetime, timedelta

router = APIRouter(prefix="/agent", tags=["agent"])

@router.get("/dashboard/{email}")
def agent_dashboard(email: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # 30-day window
    start_date = datetime.now() - timedelta(days=30)

    # Tickets sold in last 30 days
    cursor.execute("""
        SELECT 
            COUNT(*) AS tickets_sold,
            SUM(T.price_charged * 0.10) AS total_commission,
            AVG(T.price_charged * 0.10) AS avg_commission
        FROM purchase P
        JOIN ticket T ON P.ticket_id = T.ticket_id
        WHERE P.agent_email = %s
          AND P.purchase_date >= %s
    """, (email, start_date))

    row = cursor.fetchone()

    cursor.close()
    conn.close()

    return {
        "tickets_sold": row["tickets_sold"] or 0,
        "total_commission": float(row["total_commission"] or 0),
        "avg_commission": float(row["avg_commission"] or 0)
    }

@router.get("/flights/{email}")
def agent_flights(email: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            T.ticket_id,
            C.name AS customer_name,
            F.airline_name,
            F.flight_num,
            F.departure_airport AS from_airport,
            F.arrival_airport AS to_airport,
            F.departure_time,
            F.arrival_time,
            T.price_charged
        FROM purchase P
        JOIN ticket T ON P.ticket_id = T.ticket_id
        JOIN flight F ON T.flight_num = F.flight_num
        JOIN customer C ON P.customer_email = C.email
        WHERE P.agent_email = %s
        ORDER BY P.purchase_date DESC
    """, (email,))

    flights = cursor.fetchall()

    cursor.close()
    conn.close()

    return {"flights": flights}

@router.get("/analytics/{email}")
def agent_analytics(email: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    now = datetime.now()
    last_30 = now - timedelta(days=30)
    last_90 = now - timedelta(days=90)
    last_year = now - timedelta(days=365)

    # ------------------------------------------
    # 1️⃣ Summary (last 30 days)
    # ------------------------------------------
    cursor.execute("""
        SELECT 
            COUNT(*) AS tickets_sold,
            SUM(T.price_charged * 0.10) AS total_commission,
            AVG(T.price_charged * 0.10) AS avg_commission
        FROM purchase P
        JOIN ticket T ON P.ticket_id = T.ticket_id
        WHERE P.agent_email = %s
          AND P.purchase_date >= %s
    """, (email, last_30))
    summary = cursor.fetchone()

    # ------------------------------------------
    # 2️⃣ Tickets sold per month (last 12 months)
    # ------------------------------------------
    cursor.execute("""
        SELECT 
            DATE_FORMAT(P.purchase_date, '%Y-%m') AS month,
            COUNT(*) AS tickets,
            SUM(T.price_charged * 0.10) AS commission
        FROM purchase P
        JOIN ticket T ON P.ticket_id = T.ticket_id
        WHERE P.agent_email = %s
          AND P.purchase_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY month
        ORDER BY month ASC
    """, (email,))
    monthly = cursor.fetchall()

    # ------------------------------------------
    # 3️⃣ Top 5 customers (tickets)
    # ------------------------------------------
    cursor.execute("""
        SELECT 
            C.name AS customer_name,
            COUNT(*) AS ticket_count
        FROM purchase P
        JOIN customer C ON P.customer_email = C.email
        WHERE P.agent_email = %s
        GROUP BY customer_name
        ORDER BY ticket_count DESC
        LIMIT 5
    """, (email,))
    top_ticket_customers = cursor.fetchall()

    # ------------------------------------------
    # 4️⃣ Top 5 customers (commission)
    # ------------------------------------------
    cursor.execute("""
        SELECT 
            C.name AS customer_name,
            SUM(T.price_charged * 0.10) AS commission_earned
        FROM purchase P
        JOIN ticket T ON P.ticket_id = T.ticket_id
        JOIN customer C ON P.customer_email = C.email
        WHERE P.agent_email = %s
        GROUP BY customer_name
        ORDER BY commission_earned DESC
        LIMIT 5
    """, (email,))
    top_commission_customers = cursor.fetchall()

    # ------------------------------------------
    # 5️⃣ Top destinations (last 3 months)
    # ------------------------------------------
    cursor.execute("""
        SELECT 
            F.arrival_airport AS city,
            COUNT(*) AS count
        FROM purchase P
        JOIN ticket T ON P.ticket_id = T.ticket_id
        JOIN flight F ON T.flight_num = F.flight_num AND T.airline_name = F.airline_name
        WHERE P.purchase_date >= %s
          AND P.agent_email = %s
        GROUP BY city
        ORDER BY count DESC
        LIMIT 5
    """, (last_90, email))
    top_3m = cursor.fetchall()

    # ------------------------------------------
    # 6️⃣ Top destinations (last 1 year)
    # ------------------------------------------
    cursor.execute("""
        SELECT 
            F.arrival_airport AS city,
            COUNT(*) AS count
        FROM purchase P
        JOIN ticket T ON P.ticket_id = T.ticket_id
        JOIN flight F ON T.flight_num = F.flight_num AND T.airline_name = F.airline_name
        WHERE P.purchase_date >= %s
          AND P.agent_email = %s
        GROUP BY city
        ORDER BY count DESC
        LIMIT 5
    """, (last_year, email))
    top_year = cursor.fetchall()

    cursor.close()
    conn.close()

    return {
        "summary": {
            "tickets_sold": summary["tickets_sold"] or 0,
            "total_commission": float(summary["total_commission"] or 0),
            "avg_commission": float(summary["avg_commission"] or 0),
        },
        "monthly": monthly,
        "top_tickets": top_ticket_customers,
        "top_commission": top_commission_customers,
        "top_destinations_3m": top_3m,
        "top_destinations_year": top_year
    }
