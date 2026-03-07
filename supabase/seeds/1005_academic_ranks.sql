INSERT INTO academic_rank (code, title, description) 
VALUES 
    -- Instructor Ranks
    ('INSTR1', 'Instructor I', 'Entry-level academic rank typically requiring a bachelor''s degree or master''s degree in progress.'),
    ('INSTR2', 'Instructor II', 'Junior faculty rank for those with ongoing graduate studies and initial teaching experience.'),
    ('INSTR3', 'Instructor III', 'Faculty rank requiring a master''s degree and proven teaching competence.'),

    -- Assistant Professor Ranks
    ('AST_PROF1', 'Assistant Professor I', 'Entry-level professorial rank requiring a master''s degree and active research output.'),
    ('AST_PROF2', 'Assistant Professor II', 'Mid-level assistant professor with continuous professional development and publications.'),
    ('AST_PROF3', 'Assistant Professor III', 'Senior assistant professor taking on departmental leadership roles.'),
    ('AST_PROF4', 'Assistant Professor IV', 'Highest assistant professor rank, transitioning towards an associate role.'),

    -- Associate Professor Ranks
    ('ASSOC_PROF1', 'Associate Professor I', 'Mid-career professorial rank typically requiring a doctoral degree and substantial publications.'),
    ('ASSOC_PROF2', 'Associate Professor II', 'Established academic with a strong portfolio of research, extension, and teaching.'),
    ('ASSOC_PROF3', 'Associate Professor III', 'Senior associate professor with recognized expertise and peer recognition in their field.'),
    ('ASSOC_PROF4', 'Associate Professor IV', 'Highly regarded associate professor with consistent scholarly output.'),
    ('ASSOC_PROF5', 'Associate Professor V', 'Distinguished associate professor with national recognition and significant contributions to academia.'),
    ('ASSOC_PROF6', 'Associate Professor VI', 'Highest associate professor rank, preparing for full professorship.'),

    -- Professor Ranks
    ('PROF_COL', 'College Professor', 'Senior academic rank for those with a doctoral degree, extensive research, and significant contributions to their college.'),
    ('PROF_UNIV', 'University Professor', 'The highest and most prestigious academic rank, awarded for exceptional and globally recognized contributions to the university and academia.')

-- Upsert logic using the UNIQUE 'title' constraint
ON CONFLICT (title)
DO UPDATE SET 
    code = EXCLUDED.code,
    title = EXCLUDED.title,
    description = EXCLUDED.description;