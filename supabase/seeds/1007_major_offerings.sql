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
			WHERE c.code = 'CST' AND p.code = 'BSED'
		),
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSED' AND m.code = 'GEN'
		)
	),
	(
		(
			SELECT po.id
			FROM program_offering po
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			WHERE c.code = 'CST' AND p.code = 'BEED'
		),
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BEED' AND m.code = 'GEN'
		)
	),
	(
		(
			SELECT po.id
			FROM program_offering po
			JOIN campus c ON c.id = po.campus_id
			JOIN program p ON p.id = po.program_id
			WHERE c.code = 'CST' AND p.code = 'BSBA'
		),
		(
			SELECT m.id
			FROM major m
			JOIN program p ON p.id = m.program_id
			WHERE p.code = 'BSBA' AND m.code = 'GEN'
		)
	)
ON CONFLICT (program_offering_id, major_id)
DO NOTHING;
