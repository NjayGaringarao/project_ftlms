INSERT INTO academic_term (code, academic_year_id, name, start, "end") 
VALUES 
    -- ==============================
    -- ACADEMIC YEAR 2022-2023
    -- ==============================
    ('FIRST SEM - AY 2022-2023', (SELECT id FROM academic_year WHERE code = '2022-2023') , 'FIRST SEMESTER', '2022-09-26', '2023-02-11'),
    ('SECOND SEM - AY 2022-2023', (SELECT id FROM academic_year WHERE code = '2022-2023'), 'SECOND SEMESTER', '2023-03-13', '2023-07-15'),
    ('MIDYEAR - AY 2022-2023', (SELECT id FROM academic_year WHERE code = '2022-2023'), 'MIDYEAR', '2023-07-31', '2023-09-09'),

    -- ==============================
    -- ACADEMIC YEAR 2023-2024
    -- ==============================
    ('FIRST SEM - AY 2023-2024', (SELECT id FROM academic_year WHERE code = '2023-2024') , 'FIRST SEMESTER', '2023-09-11', '2023-12-23'),
    ('SECOND SEM - AY 2023-2024', (SELECT id FROM academic_year WHERE code = '2023-2024'), 'SECOND SEMESTER', '2024-01-22', '2024-05-25'),
    ('MIDYEAR - AY 2023-2024', (SELECT id FROM academic_year WHERE code = '2023-2024'), 'MIDYEAR', '2024-06-10', '2024-07-20'), 
    
    -- ==============================
    -- ACADEMIC YEAR 2024-2025
    -- ==============================
    ('FIRST SEM - AY 2024-2025', (SELECT id FROM academic_year WHERE code = '2024-2025'), 'FIRST SEMESTER', '2024-07-29', '2024-11-29'),
    ('SECOND SEM - AY 2024-2025', (SELECT id FROM academic_year WHERE code = '2024-2025'), 'SECOND SEMESTER', '2025-01-06', '2025-05-09'),
    ('MIDYEAR - AY 2024-2025', (SELECT id FROM academic_year WHERE code = '2024-2025'), 'MIDYEAR', '2025-05-26', '2025-07-04'),
     
    -- ==============================
    -- ACADEMIC YEAR 2025-2026
    -- ==============================
    ('FIRST SEM - AY 2025-2026', (SELECT id FROM academic_year WHERE code = '2025-2026'), 'FIRST SEMESTER', '2025-07-14', '2025-11-14'),
    ('SECOND SEM - AY 2025-2026', (SELECT id FROM academic_year WHERE code = '2025-2026'), 'SECOND SEMESTER', '2025-12-15', '2026-04-30'),
    ('MIDYEAR - AY 2025-2026', (SELECT id FROM academic_year WHERE code = '2025-2026'), 'MIDYEAR', '2026-05-18', '2026-06-26')


-- Upsert logic using your composite UNIQUE constraint
ON CONFLICT (code, academic_year_id) 
DO UPDATE SET 
    start = EXCLUDED.start,
    "end" = EXCLUDED."end";
