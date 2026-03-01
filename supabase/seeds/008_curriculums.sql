INSERT INTO curriculum (major_id, title, series_year, revised_year)
VALUES
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSCS' AND m.code = 'GEN'
		),
		'BSCS Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSIT' AND m.code = 'GEN'
		),
		'BSIT Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSIS' AND m.code = 'GEN'
		),
		'BSIS Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSED' AND m.code = 'GEN'
		),
		'BSED Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BEED' AND m.code = 'GEN'
		),
		'BEED Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSA' AND m.code = 'GEN'
		),
		'BSA Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSBA' AND m.code = 'GEN'
		),
		'BSBA Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BPA' AND m.code = 'GEN'
		),
		'BPA Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSTM' AND m.code = 'GEN'
		),
		'BSTM Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSHM' AND m.code = 'GEN'
		),
		'BSHM Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSMath' AND m.code = 'GEN'
		),
		'BSMath Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'ABPsych' AND m.code = 'GEN'
		),
		'ABPsych Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSCE' AND m.code = 'GEN'
		),
		'BSCE Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSCpE' AND m.code = 'GEN'
		),
		'BSCpE Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'MD' AND m.code = 'GEN'
		),
		'MD Curriculum',
		2018,
		NULL
	),
	(
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'JD' AND m.code = 'GEN'
		),
		'JD Curriculum',
		2018,
		NULL
	)

-- Upsert logic using UNIQUE NULLS NOT DISTINCT (major_id, series_year, revised_year)
ON CONFLICT (major_id, series_year, revised_year)
DO UPDATE SET
	title = EXCLUDED.title;

