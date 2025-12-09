-- At least two airports (e.g., JFK in New York and PVG in Shanghai).
INSERT INTO airport (name, city)
VALUES
('PVG', 'Shanghai'),
('JFK', 'New York'),
('NRT', 'Tokyo'),
('HND', 'Tokyo');

-- At least one airline.
INSERT INTO airline (name)
VALUES
('Jetstar Japan'),
('Spring Airlines'),
('Spring Airlines Japan'),
('Air China'),
('China Eastern Airlines');

-- At least two airplanes.
INSERT INTO airplane (airline_name, airplane_id)
VALUES
('Jetstar Japan', 'GK036'),
('Spring Airlines', '9C8515'),
('Spring Airlines Japan', 'IJ002'),
('Spring Airlines Japan', 'IJ004'),
('Air China', 'CA157'),
('China Eastern Airlines', 'MU727'),
('China Eastern Airlines', 'MU587');

INSERT INTO seat_class (class, airplane_id, airline_name, capacity, price_factor)
VALUES
('Economy', 'GK036', 'Jetstar Japan', 150, 1.00),
('Economy', '9C8515', 'Spring Airlines', 150, 1.00),
('Economy', 'IJ002', 'Spring Airlines Japan', 180, 1.00),
('Economy', 'IJ004', 'Spring Airlines Japan', 180, 1.00),
('Economy', 'CA157', 'Air China', 210, 1.00),
('Business', 'CA157', 'Air China', 40, 3.25),
('Economy', 'MU727', 'China Eastern Airlines', 210, 1.00),
('Economy', 'MU587', 'China Eastern Airlines', 240, 1.00),
('Business', 'MU587', 'China Eastern Airlines', 20, 4.25),
('First', 'MU587', 'China Eastern Airlines', 10, 11.00);

-- Several flights in different statuses (upcoming, in-progress, delayed)
INSERT INTO flight (
    flight_num, airline_name, airplane_id,
    departure_airport, arrival_airport,
    departure_time, arrival_time, status, price
)
VALUES
('GK036', 'Jetstar Japan', 'GK036', 'PVG', 'NRT',
 '2025-12-01 02:20:00', '2025-12-01 06:20:00', 'in-progress', 516.00),

('9C8515', 'Spring Airlines', '9C8515', 'PVG', 'HND',
 '2025-12-01 21:10:00', '2025-12-02 01:05:00', 'upcoming', 533.00),

('IJ002', 'Spring Airlines Japan', 'IJ002', 'PVG', 'NRT',
 '2025-12-01 02:20:00', '2025-12-01 06:20:00', 'in-progress', 603.00),

('IJ004', 'Spring Airlines Japan', 'IJ004', 'PVG', 'NRT',
 '2025-12-01 17:30:00', '2025-12-01 21:30:00', 'upcoming', 697.00),

('CA157', 'Air China', 'CA157', 'PVG', 'NRT',
 '2025-12-01 17:00:00', '2025-12-01 20:45:00', 'delayed', 1050.00),

('MU727', 'China Eastern Airlines', 'MU727', 'PVG', 'NRT',
 '2025-12-01 08:20:00', '2025-12-01 12:00:00', 'upcoming', 1063.00),

('MU587', 'China Eastern Airlines', 'MU587', 'PVG', 'JFK',
 '2025-11-11 11:30:00', '2025-11-11 13:25:00', 'delayed', 7165.00);

-- Several tickets, including at least one purchased through a booking agent
INSERT INTO ticket (ticket_id, seat_class, airplane_id, flight_num, airline_name, price_charged)
VALUES
(1001, 'Economy', 'GK036', 'GK036', 'Jetstar Japan', 516.00),
(1002, 'Economy', '9C8515', '9C8515', 'Spring Airlines', 533.00),
(1003, 'Economy', 'IJ002', 'IJ002', 'Spring Airlines Japan', 603.00),
(1004, 'Economy', 'IJ004', 'IJ004', 'Spring Airlines Japan', 697.00),
(1007, 'Economy', 'CA157', 'CA157', 'Air China', 1050.00),
(1008, 'Economy', 'MU727', 'MU727', 'China Eastern Airlines', 1063.00),
(1010, 'Economy', 'MU587', 'MU587', 'China Eastern Airlines', 7165.00),
(1011, 'Business', 'MU587', 'MU587', 'China Eastern Airlines', 31925.50),
(1012, 'First', 'MU587', 'MU587', 'China Eastern Airlines', 80247.00);