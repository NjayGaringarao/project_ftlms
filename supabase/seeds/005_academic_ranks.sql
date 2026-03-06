INSERT INTO academic_rank (number, title, description) 
VALUES 
    -- Instructor Ranks
    (1, 'Instructor I', 'Entry-level academic rank typically requiring a bachelor''s degree or master''s degree in progress.'),
    (2, 'Instructor II', 'Junior faculty rank for those with ongoing graduate studies and initial teaching experience.'),
    (3, 'Instructor III', 'Faculty rank requiring a master''s degree and proven teaching competence.'),

    -- Assistant Professor Ranks
    (4, 'Assistant Professor I', 'Entry-level professorial rank requiring a master''s degree and active research output.'),
    (5, 'Assistant Professor II', 'Mid-level assistant professor with continuous professional development and publications.'),
    (6, 'Assistant Professor III', 'Senior assistant professor taking on departmental leadership roles.'),
    (7, 'Assistant Professor IV', 'Highest assistant professor rank, transitioning towards an associate role.'),

    -- Associate Professor Ranks
    (8, 'Associate Professor I', 'Mid-career professorial rank typically requiring a doctoral degree and substantial publications.'),
    (9, 'Associate Professor II', 'Established academic with a strong portfolio of research, extension, and teaching.'),
    (10, 'Associate Professor III', 'Senior associate professor with recognized expertise and peer recognition in their field.'),
    (11, 'Associate Professor IV', 'Highly regarded associate professor with consistent scholarly output.'),
    (12, 'Associate Professor V', 'Distinguished associate professor with national recognition and significant contributions to academia.'),
    (13, 'Associate Professor VI', 'Highest associate professor rank, preparing for full professorship.'),

    -- Professor Ranks
    (14, 'College Professor', 'Senior academic rank for those with a doctoral degree, extensive research, and significant contributions to their college.'),
    (15, 'University Professor', 'The highest and most prestigious academic rank, awarded for exceptional and globally recognized contributions to the university and academia.')

-- Upsert logic using the UNIQUE 'number' constraint
ON CONFLICT (number) 
DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description;