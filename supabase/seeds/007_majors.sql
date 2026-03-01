INSERT INTO major (program_id, code, name, description)
VALUES
	(
		(SELECT id FROM program WHERE code = 'BSCS'),
		'GEN',
		'General Computer Science',
		'Core computer science track covering algorithms, systems, and software engineering.'
	),
	(
		(SELECT id FROM program WHERE code = 'BSIT'),
		'GEN',
		'General Information Technology',
		'Balanced IT track focused on infrastructure, applications, and information services.'
	),
	(
		(SELECT id FROM program WHERE code = 'BSIS'),
		'GEN',
		'General Information Systems',
		'Interdisciplinary track combining business processes and information systems design.'
	),
	(
		(SELECT id FROM program WHERE code = 'BSED'),
		'GEN',
		'General Secondary Education',
		'Broad secondary education specialization for curriculum and instructional planning.'
	),
	(
		(SELECT id FROM program WHERE code = 'BEED'),
		'GEN',
		'General Elementary Education',
		'Foundational elementary education track for learner-centered pedagogy.'
	),
	(
		(SELECT id FROM program WHERE code = 'BSA'),
		'GEN',
		'General Accountancy',
		'Accountancy track focused on financial reporting, auditing, and taxation.'
	),
	(
		(SELECT id FROM program WHERE code = 'BSBA'),
		'GEN',
		'General Business Administration',
		'Comprehensive business track for management, operations, and entrepreneurship.'
	),
	(
		(SELECT id FROM program WHERE code = 'BPA'),
		'GEN',
		'General Public Administration',
		'Public service and governance track emphasizing policy and administration.'
	),
	(
		(SELECT id FROM program WHERE code = 'BSTM'),
		'GEN',
		'General Tourism Management',
		'Tourism track focused on travel operations and destination management.'
	),
	(
		(SELECT id FROM program WHERE code = 'BSHM'),
		'GEN',
		'General Hospitality Management',
		'Hospitality operations track for hotel, food service, and events.'
	),
	(
		(SELECT id FROM program WHERE code = 'BSMath'),
		'GEN',
		'General Mathematics',
		'Mathematics track covering theoretical and applied quantitative methods.'
	),
	(
		(SELECT id FROM program WHERE code = 'ABPsych'),
		'GEN',
		'General Psychology',
		'Psychology track on human behavior, cognition, and social dynamics.'
	),
	(
		(SELECT id FROM program WHERE code = 'BSCE'),
		'GEN',
		'General Civil Engineering',
		'Civil engineering track for structural, geotechnical, and infrastructure systems.'
	),
	(
		(SELECT id FROM program WHERE code = 'BSCpE'),
		'GEN',
		'General Computer Engineering',
		'Computer engineering track integrating electronics, hardware, and embedded systems.'
	),
	(
		(SELECT id FROM program WHERE code = 'MD'),
		'GEN',
		'General Medicine',
		'Medical education track for foundational and clinical learning progression.'
	),
	(
		(SELECT id FROM program WHERE code = 'JD'),
		'GEN',
		'General Law',
		'Law program track focused on legal theory, jurisprudence, and practice.'
	)

-- Upsert logic using the composite UNIQUE (program_id, code) constraint
ON CONFLICT (program_id, code)
DO UPDATE SET
	name = EXCLUDED.name,
	description = EXCLUDED.description;
