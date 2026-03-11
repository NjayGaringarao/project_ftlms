INSERT INTO major_offering (code, program_offering_id, major_id)
VALUES
	(
		'BSCS-GEN-CST',
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
		'BSIT-GEN-CST',
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
		'BSIS-GEN-CST',
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
