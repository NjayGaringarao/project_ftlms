INSERT INTO academic_year (code, start_year, end_year) 
VALUES 
    ('2021-2022', 2021, 2022),
    ('2022-2023', 2022, 2023),
    ('2023-2024', 2023, 2024),
    ('2024-2025', 2024, 2025),
    ('2025-2026', 2025, 2026)
ON CONFLICT (code, start_year, end_year)
DO NOTHING;