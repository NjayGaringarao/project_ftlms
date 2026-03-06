INSERT INTO college (code, name, type, description)
VALUES 
    ('CCIT', 'College of Communication and Information Technology', 'ACADEMIC', 'Focuses on computing, software development, information systems, and digital communication technologies.'),
    ('CTE', 'College of Teacher Education', 'ACADEMIC', 'Provides pedagogical training and comprehensive education programs for future teachers and educational administrators.'),
    ('CBAPA', 'College of Business, Accountancy and Public Administration', 'ACADEMIC', 'Offers programs in business management, accounting, finance, and public service administration.'),
    ('CTHM', 'College of Tourism and Hospitality Management', 'ACADEMIC', 'Prepares students for careers in hotel and restaurant management, travel, and the global tourism industry.'),
    ('CAS', 'College of Arts and Science', 'ACADEMIC', 'Offers foundational and advanced studies in humanities, social sciences, natural sciences, and mathematics.'),
    ('COE', 'College of Engineering', 'ACADEMIC', 'Provides rigorous academic and practical training in various engineering disciplines and technological design.'),
    ('COM', 'College of Medicine', 'ACADEMIC', 'Dedicated to the education and training of future physicians, medical research, and healthcare professionals.'),
    ('COL', 'College of Law', 'ACADEMIC', 'Offers legal education preparing students for the practice of law, judiciary roles, and legal scholarship.')

-- Upsert logic using the UNIQUE 'code' constraint
ON CONFLICT (code) 
DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    description = EXCLUDED.description;