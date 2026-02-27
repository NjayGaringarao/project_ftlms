INSERT INTO department (code, name, type, description) 
VALUES 
    ('CCIT', 'College of Communication and Information Technology', 'ACADEMIC', 'Focuses on computing, software development, information systems, and digital communication technologies.'),
    ('CTE', 'College of Teacher Education', 'ACADEMIC', 'Provides pedagogical training and comprehensive education programs for future teachers and educational administrators.'),
    ('CBAPA', 'College of Business, Accountancy and Public Administration', 'ACADEMIC', 'Offers programs in business management, accounting, finance, and public service administration.'),
    ('CTHM', 'College of Tourism and Hospitality Management', 'ACADEMIC', 'Prepares students for careers in hotel and restaurant management, travel, and the global tourism industry.'),
    ('CAS', 'College of Arts and Science', 'ACADEMIC', 'Offers foundational and advanced studies in humanities, social sciences, natural sciences, and mathematics.'),
    ('COE', 'College of Engineering', 'ACADEMIC', 'Provides rigorous academic and practical training in various engineering disciplines and technological design.'),
    ('COM', 'College of Medicine', 'ACADEMIC', 'Dedicated to the education and training of future physicians, medical research, and healthcare professionals.'),
    ('COL', 'College of Law', 'ACADEMIC', 'Offers legal education preparing students for the practice of law, judiciary roles, and legal scholarship.'),
    ('ICTO', 'Information and Communication Office', 'ADMINISTRATIVE', 'Manages the institution''s technological infrastructure, network services, and technical support for students and staff.'),
    ('GAD', 'Gender and Development', 'STUDENT_SERVICES', 'Promotes gender equality, awareness, and inclusive policies across the institution''s programs and activities.'),
    ('GS', 'Graduate School', 'ADMINISTRATIVE', 'Administers advanced academic programs, master''s and doctoral degrees, and oversees institutional research initiatives.'),
    ('SA', 'Campus Student Affairs', 'STUDENT_SERVICES', 'Manages student welfare, extracurricular activities, organizations, and provides essential support services to enhance the student experience.')

-- Upsert logic using the UNIQUE 'code' constraint
ON CONFLICT (code) 
DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    description = EXCLUDED.description;