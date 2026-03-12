-- =========================================================
-- Block seed data
-- =========================================================

INSERT INTO public.block (code, major_offering_id, academic_term_id, year_level, section, student_count)
SELECT
	format(
		'%s %s %s-%s %s %s-%s',
		cp.code,
		p.code,
		src.year_level,
		src.section,
		CASE at.name
			WHEN 'FIRST SEMESTER' THEN '1/2'
			WHEN 'SECOND SEMESTER' THEN '2/2'
			WHEN 'MIDYEAR' THEN 'MID'
			ELSE at.name::text
		END,
		right(ay.start_year::text, 2),
		right(ay.end_year::text, 2)
	),
	mo.id,
	at.id,
	src.year_level,
	src.section,
	src.student_count
FROM (
	VALUES
		('BSCS', 1, 'A', 40, 'FIRST SEM - AY 2024-2025'),
		('BSCS', 2, 'A', 38, 'FIRST SEM - AY 2024-2025'),
		('BSCS', 3, 'A', 36, 'FIRST SEM - AY 2024-2025'),
		('BSCS', 4, 'A', 32, 'FIRST SEM - AY 2024-2025'),
		('BSIT', 1, 'A', 42, 'FIRST SEM - AY 2024-2025'),
		('BSIT', 2, 'A', 39, 'FIRST SEM - AY 2024-2025'),
		('BSIT', 3, 'A', 35, 'FIRST SEM - AY 2024-2025'),
		('BSIT', 4, 'A', 30, 'FIRST SEM - AY 2024-2025'),
		('BSIS', 1, 'A', 35, 'FIRST SEM - AY 2024-2025'),
		('BSIS', 2, 'A', 33, 'FIRST SEM - AY 2024-2025'),
		('BSIS', 3, 'A', 30, 'FIRST SEM - AY 2024-2025'),
		('BSIS', 4, 'A', 28, 'FIRST SEM - AY 2024-2025')
) AS src(program_code, year_level, section, student_count, term_code)
JOIN public.major_offering mo
	ON mo.id = (
		SELECT mo2.id
		FROM public.major_offering mo2
		JOIN public.program_offering po ON po.id = mo2.program_offering_id
		JOIN public.campus cp2 ON cp2.id = po.campus_id
		JOIN public.program p2 ON p2.id = po.program_id
		JOIN public.major m ON m.id = mo2.major_id
		WHERE cp2.code = 'CST'
			AND p2.code = src.program_code
			AND m.code = 'GEN'
	)
JOIN public.program_offering po ON po.id = mo.program_offering_id
JOIN public.campus cp ON cp.id = po.campus_id
JOIN public.program p ON p.id = po.program_id
JOIN public.academic_term at
	ON at.code = src.term_code
JOIN public.academic_year ay
	ON ay.id = at.academic_year_id
ON CONFLICT (major_offering_id, academic_term_id, year_level, section)
DO UPDATE SET
	code = EXCLUDED.code,
	student_count = EXCLUDED.student_count;
