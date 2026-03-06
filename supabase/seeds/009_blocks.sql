-- =========================================================
-- Prerequisite seed data for block rows
-- =========================================================

INSERT INTO program_offering (campus_id, program_id)
VALUES
	(
		(SELECT id FROM campus WHERE code = 'CST'),
		(SELECT id FROM program WHERE code = 'BSCS')
	),
	(
		(SELECT id FROM campus WHERE code = 'CST'),
		(SELECT id FROM program WHERE code = 'BSIT')
	),
	(
		(SELECT id FROM campus WHERE code = 'CST'),
		(SELECT id FROM program WHERE code = 'BSIS')
	)
ON CONFLICT (campus_id, program_id)
DO NOTHING;

INSERT INTO major_offering (program_offering_id, major_id)
VALUES
	(
		(
			SELECT po.id
			FROM program_offering po
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			WHERE c.code = 'CST' AND p.code = 'BSCS'
		),
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSCS' AND m.code = 'GEN'
		)
	),
	(
		(
			SELECT po.id
			FROM program_offering po
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			WHERE c.code = 'CST' AND p.code = 'BSIT'
		),
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSIT' AND m.code = 'GEN'
		)
	),
	(
		(
			SELECT po.id
			FROM program_offering po
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			WHERE c.code = 'CST' AND p.code = 'BSIS'
		),
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSIS' AND m.code = 'GEN'
		)
	)
ON CONFLICT (program_offering_id, major_id)
DO NOTHING;

-- =========================================================
-- Block seed data
-- =========================================================

INSERT INTO block (
	major_offering_id,
	academic_term_id,
	code,
	year_level,
	section,
	student_count
)
SELECT
	mo.id,
	at.id,
	format('%s-Y%s%s', src.program_code, src.year_level, src.section),
	src.year_level,
	src.section,
	src.student_count
FROM (
	VALUES
		('BSCS', 1, 'A', 40),
		('BSCS', 2, 'A', 38),
		('BSCS', 3, 'A', 36),
		('BSCS', 4, 'A', 32),
		('BSIT', 1, 'A', 42),
		('BSIT', 2, 'A', 39),
		('BSIT', 3, 'A', 35),
		('BSIT', 4, 'A', 30),
		('BSIS', 1, 'A', 35),
		('BSIS', 2, 'A', 33),
		('BSIS', 3, 'A', 30),
		('BSIS', 4, 'A', 28)
) AS src(program_code, year_level, section, student_count)
JOIN major_offering mo
	ON mo.id = (
		SELECT mo2.id
		FROM major_offering mo2
		JOIN program_offering po ON po.id = mo2.program_offering_id
		JOIN campus cp ON cp.id = po.campus_id
		JOIN program p ON p.id = po.program_id
		JOIN major m ON m.id = mo2.major_id
		WHERE cp.code = 'CST'
			AND p.code = src.program_code
			AND m.code = 'GEN'
	)
JOIN academic_term at
	ON at.code = '1/2 22-23'

ON CONFLICT (major_offering_id, academic_term_id, year_level, section)
DO UPDATE SET
	academic_term_id = EXCLUDED.academic_term_id,
	code = EXCLUDED.code,
	student_count = EXCLUDED.student_count;
