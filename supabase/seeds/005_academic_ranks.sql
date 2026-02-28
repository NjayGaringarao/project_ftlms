INSERT INTO academic_rank (number, title, description) 
VALUES 
    -- Instructor Ranks
    (1, 'Instructor I', 'Entry-level academic rank typically requiring a bachelor''s degree or master''s degree in progress.'),
    (2, 'Instructor II', 'Junior faculty rank for those with ongoing graduate studies and initial teaching experience.'),
    (3, 'Instructor III', 'Faculty rank requiring a master''s degree and proven teaching competence.'),
    (4, 'Instructor IV', 'Senior instructor level with substantial teaching experience and institutional contribution.'),
    (5, 'Instructor V', 'Advanced instructor level reflecting high teaching proficiency and academic service.'),
    (6, 'Instructor VI', 'Highly experienced instructor often handling specialized or advanced coursework.'),
    (7, 'Instructor VII', 'Highest instructor rank, demonstrating extensive teaching experience and academic leadership.'),

    -- Assistant Professor Ranks
    (8, 'Assistant Professor I', 'Entry-level professorial rank requiring a master''s degree and active research output.'),
    (9, 'Assistant Professor II', 'Mid-level assistant professor with continuous professional development and publications.'),
    (10, 'Assistant Professor III', 'Senior assistant professor taking on departmental leadership roles.'),
    (11, 'Assistant Professor IV', 'Highest assistant professor rank, transitioning towards an associate role.'),

    -- Associate Professor Ranks
    (12, 'Associate Professor I', 'Mid-career professorial rank typically requiring a doctoral degree and substantial publications.'),
    (13, 'Associate Professor II', 'Established academic with a strong portfolio of research, extension, and teaching.'),
    (14, 'Associate Professor III', 'Senior associate professor with recognized expertise and peer recognition in their field.'),
    (15, 'Associate Professor IV', 'Highly regarded associate professor with consistent scholarly output.'),
    (16, 'Associate Professor V', 'Highest associate professor rank, preparing for full professorship.'),

    -- Professor Ranks
    (17, 'Professor I', 'Full professorial rank recognizing outstanding academic, research, and leadership achievements.'),
    (18, 'Professor II', 'Distinguished full professor with national recognition in their discipline.'),
    (19, 'Professor III', 'Eminent professor with significant contributions to their field of specialization.'),
    (20, 'Professor IV', 'Highly eminent professor with sustained excellence in research, teaching, and mentorship.'),
    (21, 'Professor V', 'Senior full professor with international publications and widespread academic influence.'),
    (22, 'Professor VI', 'Highest standard professorial rank reserved for highly distinguished academics.'),

    -- University Rank
    (23, 'University Professor', 'The highest and most prestigious academic rank, awarded for exceptional and globally recognized contributions to the university and academia.')

-- Upsert logic using the UNIQUE 'number' constraint
ON CONFLICT (number) 
DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description;