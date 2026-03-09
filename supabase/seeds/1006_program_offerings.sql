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
