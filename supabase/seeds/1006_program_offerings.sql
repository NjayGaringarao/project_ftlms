INSERT INTO program_offering (campus_id, program_id)
VALUES
	(
		(SELECT id FROM campus WHERE code = 'CST'),
		(SELECT id FROM program WHERE code = 'BSCS')
	),
	(
		(SELECT id FROM campus WHERE code = 'CST'),
		(SELECT id FROM program WHERE code = 'BSED')
	),
	(
		(SELECT id FROM campus WHERE code = 'CST'),
		(SELECT id FROM program WHERE code = 'BEED')
	),
	(
		(SELECT id FROM campus WHERE code = 'CST'),
		(SELECT id FROM program WHERE code = 'BSBA')
	)
ON CONFLICT (campus_id, program_id)
DO NOTHING;
