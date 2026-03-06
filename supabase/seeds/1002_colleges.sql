INSERT INTO college (code, name, description)
VALUES 
    ('CCIT', 'College of Communication and Information Technology', 'Focuses on computing, software development, information systems, and digital communication technologies.'),
    ('CTE', 'College of Teacher Education', 'Provides pedagogical training and comprehensive education programs for future teachers and educational administrators.'),
    ('CBAPA', 'College of Business, Accountancy and Public Administration', 'Offers programs in business management, accounting, finance, and public service administration.'),
    ('CTHM', 'College of Tourism and Hospitality Management', 'Prepares students for careers in hotel and restaurant management, travel, and the global tourism industry.'),
    ('CAS', 'College of Arts and Science', 'Offers foundational and advanced studies in humanities, social sciences, natural sciences, and mathematics.'),
    ('COE', 'College of Engineering', 'Provides rigorous academic and practical training in various engineering disciplines and technological design.'),
    ('COM', 'College of Medicine', 'Dedicated to the education and training of future physicians, medical research, and healthcare professionals.'),
    ('COL', 'College of Law', 'Offers legal education preparing students for the practice of law, judiciary roles, and legal scholarship.')

-- Upsert logic using the UNIQUE 'code' constraint
ON CONFLICT (code) 
DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description;