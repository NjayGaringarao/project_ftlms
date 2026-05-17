-- =========================================================
-- Section seed data
-- =========================================================

INSERT INTO public.section (
	major_offering_id,
	academic_term_id,
	year_level,
	name,
	classification,
	student_count
)
SELECT
	mo.id,
	at.id,
	src.year_level,
	src.name,
	'regular',
	src.student_count
FROM (
	VALUES
		('BSCS', 1, 'A', 40, 'SECOND SEM - AY 2025-2026'),
		('BSCS', 2, 'A', 38, 'SECOND SEM - AY 2025-2026'),
		('BSCS', 3, 'A', 36, 'SECOND SEM - AY 2025-2026'),
		('BSCS', 4, 'A', 32, 'SECOND SEM - AY 2025-2026'),
		('BSIT', 1, 'A', 42, 'SECOND SEM - AY 2025-2026'),
		('BSIT', 2, 'A', 39, 'SECOND SEM - AY 2025-2026'),
		('BSIT', 3, 'A', 35, 'SECOND SEM - AY 2025-2026'),
		('BSIT', 4, 'A', 30, 'SECOND SEM - AY 2025-2026'),
		('BSIS', 1, 'A', 35, 'SECOND SEM - AY 2025-2026'),
		('BSIS', 2, 'A', 33, 'SECOND SEM - AY 2025-2026'),
		('BSIS', 3, 'A', 30, 'SECOND SEM - AY 2025-2026'),
		('BSIS', 4, 'A', 28, 'SECOND SEM - AY 2025-2026')
) AS src(program_code, year_level, name, student_count, term_code)
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
JOIN public.academic_term at
	ON at.code = src.term_code
ON CONFLICT (major_offering_id, academic_term_id, year_level, name)
DO UPDATE SET
	student_count = EXCLUDED.student_count;
