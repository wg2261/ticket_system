CREATE DATABASE IF NOT EXISTS air_reservation;
USE air_reservation;

CREATE TABLE airport (
    name VARCHAR(10) PRIMARY KEY,
    city VARCHAR(50) NOT NULL
);

CREATE TABLE airline (
    name VARCHAR(50) PRIMARY KEY
);

-- Airline owns airplanes 1:N
CREATE TABLE airplane (
    airplane_id VARCHAR(15) NOT NULL,
    airline_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (airline_name, airplane_id),
    FOREIGN KEY (airline_name) REFERENCES airline(name)
        ON DELETE CASCADE
);

-- Airport arrive / depart for Flight 1:N
-- Airline operates Flights 1:N
-- An airplane is assigned to a flight 1:N
CREATE TABLE flight (
    flight_num VARCHAR(15),
    airline_name VARCHAR(50) NOT NULL,
    airplane_id VARCHAR(15) NOT NULL,
    departure_airport VARCHAR(50) NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_airport VARCHAR(50) NOT NULL,
    arrival_time DATETIME NOT NULL,
    status VARCHAR(12) 
        DEFAULT 'upcoming' 
        CHECK (status IN ('upcoming','in-progress','delayed')),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    PRIMARY KEY (airline_name, flight_num),
    FOREIGN KEY (airline_name) REFERENCES airline(name),
    FOREIGN KEY (airline_name, airplane_id) REFERENCES airplane(airline_name, airplane_id),
    FOREIGN KEY (arrival_airport) REFERENCES airport(name),
    FOREIGN KEY (departure_airport) REFERENCES airport(name)
);

CREATE TABLE airline_staff (
    email VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    airline_name VARCHAR(50) NOT NULL,
    permission VARCHAR(10) 
        DEFAULT 'admin' 
        CHECK (permission IN ('admin','operator','both')),
    FOREIGN KEY (airline_name) REFERENCES airline(name)
        ON DELETE CASCADE
);

-- Twist
-- An airplane owns multiple seat classes 1:N
-- Weak entity of Weak entity :)
CREATE TABLE seat_class (
    class VARCHAR(50),
    airplane_id VARCHAR(15),
    airline_name VARCHAR(50) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    price_factor DECIMAL(4,2) NOT NULL CHECK (price_factor > 0),
    PRIMARY KEY (airline_name, airplane_id, class),
    FOREIGN KEY (airline_name, airplane_id) REFERENCES airplane(airline_name, airplane_id)
        ON DELETE CASCADE
);

-- Each seat uses one ticket 1:N
-- There are multiple tickets for a flight 1:N
CREATE TABLE ticket (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    seat_class VARCHAR(50) NOT NULL,
    airplane_id VARCHAR(15) NOT NULL,
    flight_num VARCHAR(15) NOT NULL,
    airline_name VARCHAR(50) NOT NULL,
    price_charged DECIMAL(10,2) NOT NULL CHECK (price_charged > 0),
    FOREIGN KEY (airline_name, flight_num) REFERENCES flight(airline_name, flight_num),
    FOREIGN KEY (airline_name, airplane_id, seat_class)
        REFERENCES seat_class(airline_name, airplane_id, class)
);

-- Customer information
CREATE TABLE customer (
    email VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    building_number VARCHAR(30),
    street VARCHAR(30),
    city VARCHAR(30),
    state VARCHAR(30),
    phone_number VARCHAR(20),
    passport_number VARCHAR(15),
    passport_expiration_date DATE,
    passport_country VARCHAR(50),
    date_of_birth DATE
);

-- Booking agent information
CREATE TABLE booking_agent (
    email VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL
);

-- A booking agent can be authorized by multiple airlines, airlines can have multiple booking agents M:N
CREATE TABLE agent_airline_authorization (
    agent_email VARCHAR(50) NOT NULL,
    airline_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (agent_email, airline_name),
    FOREIGN KEY (agent_email) REFERENCES booking_agent(email)
        ON DELETE CASCADE,
    FOREIGN KEY (airline_name) REFERENCES airline(name)
        ON DELETE CASCADE
);

-- Saves purchase information
CREATE TABLE purchase (
    ticket_id INT PRIMARY KEY,
    customer_email VARCHAR(50) NOT NULL,
    agent_email VARCHAR(50),
    purchase_date DATE NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id),
    FOREIGN KEY (customer_email) REFERENCES customer(email),
    FOREIGN KEY (agent_email) REFERENCES booking_agent(email)
);
