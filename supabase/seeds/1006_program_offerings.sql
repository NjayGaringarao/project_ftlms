INSERT INTO program_offering (code, campus_id, program_id)
VALUES
	(
		'BSCS-CST',
		(SELECT id FROM campus WHERE code = 'CST'),
		(SELECT id FROM program WHERE code = 'BSCS')
	),
	(
		'BSIT-CST',
		(SELECT id FROM campus WHERE code = 'CST'),
		(SELECT id FROM program WHERE code = 'BSIT')
	),
	(
		'BSIS-CST',
		(SELECT id FROM campus WHERE code = 'CST'),
		(SELECT id FROM program WHERE code = 'BSIS')
	)
ON CONFLICT (campus_id, program_id)
DO NOTHING;
