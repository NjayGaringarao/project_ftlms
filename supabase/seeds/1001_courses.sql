INSERT INTO course (code, title, lecture_unit, laboratory_unit) 
VALUES 
    -- 1st Year, 1st Semester
    ('GEC 3AA', 'The Contemporary World (with Peace Education)', 3, 0),
    ('NSTP 1', 'National Service Training Program (Common Module)', 3, 0),
    ('PE 1-', 'Physical Activities Toward Health and Fitness 1 (PATHFit 1) (Movement Competency Training)', 2, 0),
    ('FILN 1', 'Kontekstwalisadong Komunikasyon sa Filipino', 3, 0),
    ('GEC 7', 'Science, Technology and Society', 3, 0),
    ('GEC 1', 'Understanding the Self', 3, 0),
    ('EN+', 'Enhanced Communication Skills', 3, 0),
    ('CC 101', 'Introduction to Computing', 3, 0),
    
    -- 1st Year, 2nd Semester
    ('NSTP-2', 'LTS/CWTS/ROTC', 3, 0),
    ('GEC 2AA', 'Readings in Philippine History(with IP Education)', 3, 0),
    ('NSTP 2B', 'Literacy Training Service II', 3, 0),
    ('NSTP 2A', 'Civic Welfare Training Sercvices II', 3, 0),
    ('NSTP 2', 'Reserve Officers Training Corps II', 3, 0),
    ('PE 2-', 'Physical Activities Toward Health and Fitness 2 (PATHFit 2) (Exercise-based Fitness Activities)', 2, 0),
    ('GEC 6', 'Art Appreciation', 3, 0),
    ('GEC 5', 'Purposive Communication', 3, 0),
    ('GEC 4', 'Mathematics in the Modern World', 3, 0),
    ('FMCS 101', 'Fundamentals of Mathematics for Computer Science', 3, 0),
    ('CC 102', 'Computer Programming I', 3, 0),
    
    -- 2nd Year, 1st Semester
    ('PE 3-', 'Physical Activities Toward Health and Fitness 3 (PATHFit 3) (Dance)', 2, 0),
    ('GEE 14', 'Technopreneurship', 3, 0),
    ('GEM', 'Life and Works of Rizal', 3, 0),
    ('MTN 4', 'Calculus I', 3, 0),
    ('FLNG', 'Foreign Language', 3, 0),
    ('CSE 1', 'CS Elective I', 3, 0),
    ('CC 103', 'Computer Programming II', 3, 0),
    ('DS 101', 'Discrete Structures I', 3, 0),
    
    -- 2nd Year, 2nd Semester
    ('PSTAT 101', 'Probability Theory and Statistical Analysis', 3, 0),
    ('GEE 15', 'ASEAN Culture and Studies', 3, 0),
    ('PE 4-', 'Physical Activities Toward Health and Fitness 4 (PATHFit 4) (Sports)', 2, 0),
    ('MTN 5', 'Calculus II', 3, 0),
    ('SDF 104', 'Object-Oriented Programming', 3, 0),
    ('CC 106', 'Applications Development and Emerging Technologies', 3, 0),
    ('CC 104', 'Data Structures and Algorithm', 3, 0),
    ('DS 102', 'Discrete Structures II', 3, 0),
    
    -- 3rd Year, 1st Semester
    ('MTN 6', 'Differential Equations', 3, 0),
    ('AR 101', 'Architecture and Organization', 3, 0),
    ('AL 101', 'Algorithms and Complexity', 3, 0),
    ('NC 101', 'Networks and Communication', 3, 0),
    ('CSE 2', 'CS elective II', 3, 0),
    ('SE 101', 'Software Engineering I', 3, 0),
    ('CC 105', 'Information Management', 3, 0),
    
    -- 3rd Year, 2nd Semester
    ('EN 1', 'Scientific and Technical Writing', 3, 0),
    ('GEC 8', 'Ethics', 3, 0),
    ('THS 102', 'CS Thesis Writting I', 3, 0),
    ('SE 102', 'Software Engineering II', 3, 0),
    ('OS 101', 'Operating System', 3, 0),
    ('PL 101', 'Programming Languages', 3, 0),
    ('GEE 7', 'Gender and Society', 3, 0),
    
    -- 4th Year, 1st Semester
    ('THS 103', 'CS Thesis Writting II', 3, 0),
    ('SP 101', 'Social Issues and Professional Practice', 3, 0),
    ('CSE 3', 'CS elective III', 3, 0),
    ('HCI 101', 'Human Computer Interaction', 1, 0),
    ('AL 102', 'Automata Theory and Formal Languages', 3, 0),
    ('IAS 101', 'Information Assurance and Security', 2, 0),

    -- 4th Year, 2nd Semester
    ('PRC 101', 'PRACTICUM (600 Hours)', 1, 0)

-- Upsert logic using the UNIQUE 'code' constraint
ON CONFLICT (code) 
DO UPDATE SET 
    title = EXCLUDED.title,
    lecture_unit = EXCLUDED.lecture_unit,
    laboratory_unit = EXCLUDED.laboratory_unit;