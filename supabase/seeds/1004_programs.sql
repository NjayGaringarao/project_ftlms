INSERT INTO program (college_id, code, name, description)
VALUES 
    -- CCIT: College of Communication and Information Technology
    (
        (SELECT id FROM college WHERE code = 'CCIT'),
        'BSCS', 'Bachelor of Science in Computer Science', 
        'Focuses on computing theory, algorithms, and software engineering.'
    ),
    (
        (SELECT id FROM college WHERE code = 'CCIT'),
        'BSIT', 'Bachelor of Science in Information Technology', 
        'Focuses on network administration, web development, and enterprise systems.'
    ),
    (
        (SELECT id FROM college WHERE code = 'CCIT'),
        'BSIS', 'Bachelor of Science in Information Systems', 
        'Bridges business management and information technology to design effective business systems.'
    ),

    -- CTE: College of Teacher Education
    (
        (SELECT id FROM college WHERE code = 'CTE'),
        'BSED', 'Bachelor of Secondary Education', 
        'Prepares students to become professional educators in secondary schools.'
    ),
    (
        (SELECT id FROM college WHERE code = 'CTE'),
        'BEED', 'Bachelor of Elementary Education', 
        'Prepares students for teaching foundational concepts in elementary education.'
    ),

    -- CBAPA: College of Business, Accountancy and Public Administration
    (
        (SELECT id FROM college WHERE code = 'CBAPA'),
        'BSA', 'Bachelor of Science in Accountancy', 
        'Provides comprehensive training in financial accounting, auditing, and taxation.'
    ),
    (
        (SELECT id FROM college WHERE code = 'CBAPA'),
        'BSBA', 'Bachelor of Science in Business Administration', 
        'Focuses on core business principles, financial management, and organizational leadership.'
    ),
    (
        (SELECT id FROM college WHERE code = 'CBAPA'),
        'BPA', 'Bachelor of Public Administration', 
        'Prepares students for careers in public service, governance, and policy making.'
    ),

    -- CTHM: College of Tourism and Hospitality Management
    (
        (SELECT id FROM college WHERE code = 'CTHM'),
        'BSTM', 'Bachelor of Science in Tourism Management', 
        'Covers travel operations, tour planning, and global tourism trends.'
    ),
    (
        (SELECT id FROM college WHERE code = 'CTHM'),
        'BSHM', 'Bachelor of Science in Hospitality Management', 
        'Focuses on hotel, restaurant, and resort operations and management.'
    ),

    -- CAS: College of Arts and Science
    (
        (SELECT id FROM college WHERE code = 'CAS'),
        'BSMath', 'Bachelor of Science in Mathematics', 
        'Focuses on pure and applied mathematics, analytical modeling, and statistics.'
    ),
    (
        (SELECT id FROM college WHERE code = 'CAS'),
        'ABPsych', 'Bachelor of Arts in Psychology', 
        'Studies human behavior, mental processes, and psychological research.'
    ),

    -- COE: College of Engineering
    (
        (SELECT id FROM college WHERE code = 'COE'),
        'BSCE', 'Bachelor of Science in Civil Engineering', 
        'Focuses on the design, construction, and maintenance of physical infrastructure.'
    ),
    (
        (SELECT id FROM college WHERE code = 'COE'),
        'BSCpE', 'Bachelor of Science in Computer Engineering', 
        'Integrates electrical engineering and computer science to develop computer hardware and software.'
    ),

    -- COM: College of Medicine
    (
        (SELECT id FROM college WHERE code = 'COM'),
        'MD', 'Doctor of Medicine', 
        'A professional degree preparing students for medical practice, diagnosis, and patient care.'
    ),

    -- COL: College of Law
    (
        (SELECT id FROM college WHERE code = 'COL'),
        'JD', 'Juris Doctor', 
        'A professional law degree focused on legal theory, practice, and jurisprudence.'
    )

-- Upsert logic using the UNIQUE 'code' constraint
ON CONFLICT (code) 
DO UPDATE SET 
    college_id = EXCLUDED.college_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description;