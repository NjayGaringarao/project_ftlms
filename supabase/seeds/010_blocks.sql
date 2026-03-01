-- =========================================================
-- Prerequisite seed data for block rows
-- =========================================================

INSERT INTO program_offering (campus_id, program_id)
VALUES
	(
		(SELECT id FROM campus WHERE name = 'Castillejos'),
		(SELECT id FROM program WHERE code = 'BSCS')
	),
	(
		(SELECT id FROM campus WHERE name = 'Castillejos'),
		(SELECT id FROM program WHERE code = 'BSIT')
	),
	(
		(SELECT id FROM campus WHERE name = 'Castillejos'),
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
			WHERE c.name = 'Castillejos' AND p.code = 'BSCS'
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
			WHERE c.name = 'Castillejos' AND p.code = 'BSIT'
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
			WHERE c.name = 'Castillejos' AND p.code = 'BSIS'
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

INSERT INTO block (major_offering_id, curriculum_id, year_level, section, student_count)
VALUES
	-- BSCS (Castillejos)
	(
		(
			SELECT mo.id
			FROM major_offering mo
			JOIN program_offering po ON po.id = mo.program_offering_id
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			JOIN major m ON m.id = mo.major_id
			WHERE c.name = 'Castillejos' AND p.code = 'BSCS' AND m.code = 'GEN'
		),
		(
			SELECT c.id
			FROM curriculum c
			JOIN major m ON m.id = c.major_id
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSCS' AND m.code = 'GEN' AND c.series_year = 2018 AND c.revised_year IS NULL
		),
		1,
		'A',
		40
	),
	(
		(
			SELECT mo.id
			FROM major_offering mo
			JOIN program_offering po ON po.id = mo.program_offering_id
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			JOIN major m ON m.id = mo.major_id
			WHERE c.name = 'Castillejos' AND p.code = 'BSCS' AND m.code = 'GEN'
		),
		(
			SELECT c.id
			FROM curriculum c
			JOIN major m ON m.id = c.major_id
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSCS' AND m.code = 'GEN' AND c.series_year = 2018 AND c.revised_year IS NULL
		),
		2,
		'A',
		38
	),
	(
		(
			SELECT mo.id
			FROM major_offering mo
			JOIN program_offering po ON po.id = mo.program_offering_id
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			JOIN major m ON m.id = mo.major_id
			WHERE c.name = 'Castillejos' AND p.code = 'BSCS' AND m.code = 'GEN'
		),
		(
			SELECT c.id
			FROM curriculum c
			JOIN major m ON m.id = c.major_id
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSCS' AND m.code = 'GEN' AND c.series_year = 2018 AND c.revised_year IS NULL
		),
		3,
		'A',
		36
	),
	(
		(
			SELECT mo.id
			FROM major_offering mo
			JOIN program_offering po ON po.id = mo.program_offering_id
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			JOIN major m ON m.id = mo.major_id
			WHERE c.name = 'Castillejos' AND p.code = 'BSCS' AND m.code = 'GEN'
		),
		(
			SELECT c.id
			FROM curriculum c
			JOIN major m ON m.id = c.major_id
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSCS' AND m.code = 'GEN' AND c.series_year = 2018 AND c.revised_year IS NULL
		),
		4,
		'A',
		32
	),

	-- BSIT (Castillejos)
	(
		(
			SELECT mo.id
			FROM major_offering mo
			JOIN program_offering po ON po.id = mo.program_offering_id
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			JOIN major m ON m.id = mo.major_id
			WHERE c.name = 'Castillejos' AND p.code = 'BSIT' AND m.code = 'GEN'
		),
		(
			SELECT c.id
			FROM curriculum c
			JOIN major m ON m.id = c.major_id
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSIT' AND m.code = 'GEN' AND c.series_year = 2018 AND c.revised_year IS NULL
		),
		1,
		'A',
		42
	),
	(
		(
			SELECT mo.id
			FROM major_offering mo
			JOIN program_offering po ON po.id = mo.program_offering_id
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			JOIN major m ON m.id = mo.major_id
			WHERE c.name = 'Castillejos' AND p.code = 'BSIT' AND m.code = 'GEN'
		),
		(
			SELECT c.id
			FROM curriculum c
			JOIN major m ON m.id = c.major_id
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSIT' AND m.code = 'GEN' AND c.series_year = 2018 AND c.revised_year IS NULL
		),
		2,
		'A',
		39
	),
	(
		(
			SELECT mo.id
			FROM major_offering mo
			JOIN program_offering po ON po.id = mo.program_offering_id
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			JOIN major m ON m.id = mo.major_id
			WHERE c.name = 'Castillejos' AND p.code = 'BSIT' AND m.code = 'GEN'
		),
		(
			SELECT c.id
			FROM curriculum c
			JOIN major m ON m.id = c.major_id
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSIT' AND m.code = 'GEN' AND c.series_year = 2018 AND c.revised_year IS NULL
		),
		3,
		'A',
		35
	),
	(
		(
			SELECT mo.id
			FROM major_offering mo
			JOIN program_offering po ON po.id = mo.program_offering_id
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			JOIN major m ON m.id = mo.major_id
			WHERE c.name = 'Castillejos' AND p.code = 'BSIT' AND m.code = 'GEN'
		),
		(
			SELECT c.id
			FROM curriculum c
			JOIN major m ON m.id = c.major_id
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSIT' AND m.code = 'GEN' AND c.series_year = 2018 AND c.revised_year IS NULL
		),
		4,
		'A',
		30
	),

	-- BSIS (Castillejos)
	(
		(
			SELECT mo.id
			FROM major_offering mo
			JOIN program_offering po ON po.id = mo.program_offering_id
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			JOIN major m ON m.id = mo.major_id
			WHERE c.name = 'Castillejos' AND p.code = 'BSIS' AND m.code = 'GEN'
		),
		(
			SELECT c.id
			FROM curriculum c
			JOIN major m ON m.id = c.major_id
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSIS' AND m.code = 'GEN' AND c.series_year = 2018 AND c.revised_year IS NULL
		),
		1,
		'A',
		35
	),
	(
		(
			SELECT mo.id
			FROM major_offering mo
			JOIN program_offering po ON po.id = mo.program_offering_id
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			JOIN major m ON m.id = mo.major_id
			WHERE c.name = 'Castillejos' AND p.code = 'BSIS' AND m.code = 'GEN'
		),
		(
			SELECT c.id
			FROM curriculum c
			JOIN major m ON m.id = c.major_id
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSIS' AND m.code = 'GEN' AND c.series_year = 2018 AND c.revised_year IS NULL
		),
		2,
		'A',
		33
	),
	(
		(
			SELECT mo.id
			FROM major_offering mo
			JOIN program_offering po ON po.id = mo.program_offering_id
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			JOIN major m ON m.id = mo.major_id
			WHERE c.name = 'Castillejos' AND p.code = 'BSIS' AND m.code = 'GEN'
		),
		(
			SELECT c.id
			FROM curriculum c
			JOIN major m ON m.id = c.major_id
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSIS' AND m.code = 'GEN' AND c.series_year = 2018 AND c.revised_year IS NULL
		),
		3,
		'A',
		30
	),
	(
		(
			SELECT mo.id
			FROM major_offering mo
			JOIN program_offering po ON po.id = mo.program_offering_id
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			JOIN major m ON m.id = mo.major_id
			WHERE c.name = 'Castillejos' AND p.code = 'BSIS' AND m.code = 'GEN'
		),
		(
			SELECT c.id
			FROM curriculum c
			JOIN major m ON m.id = c.major_id
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSIS' AND m.code = 'GEN' AND c.series_year = 2018 AND c.revised_year IS NULL
		),
		4,
		'A',
		28
	)

-- Upsert logic using the composite UNIQUE
-- (major_offering_id, curriculum_id, year_level, section) constraint
ON CONFLICT (major_offering_id, curriculum_id, year_level, section)
DO UPDATE SET
	student_count = EXCLUDED.student_count;
