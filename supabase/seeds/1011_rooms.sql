INSERT INTO room (campus_id, code, name, capacity)
VALUES
	-- Iba Campus
	((SELECT id FROM campus WHERE name = 'Iba'), 'RM101', 'Iba Room 101', 45),
	((SELECT id FROM campus WHERE name = 'Iba'), 'LAB1', 'Iba Computer Laboratory 1', 35),

	-- Botolan Campus
	((SELECT id FROM campus WHERE name = 'Botolan'), 'RM101', 'Botolan Room 101', 40),
	((SELECT id FROM campus WHERE name = 'Botolan'), 'LAB1', 'Botolan Computer Laboratory 1', 32),

	-- San Marcelino Campus
	((SELECT id FROM campus WHERE name = 'San Marcelino'), 'RM101', 'San Marcelino Room 101', 40),
	((SELECT id FROM campus WHERE name = 'San Marcelino'), 'LAB1', 'San Marcelino Computer Laboratory 1', 32),

	-- Castillejos Campus
	((SELECT id FROM campus WHERE name = 'Castillejos'), 'COMLAB-1', 'Computer Laboratory 1', 30),
	((SELECT id FROM campus WHERE name = 'Castillejos'), 'HYBRID-1', 'Hybrid Room 1', 30),
	((SELECT id FROM campus WHERE name = 'Castillejos'), 'DGT-LAB-1', 'Digital Laboratory 1', 30),
	((SELECT id FROM campus WHERE name = 'Castillejos'), 'NTWK-LAB-1', 'Network Laboratory 1', 30),
	((SELECT id FROM campus WHERE name = 'Castillejos'), 'BEEd-RM-1', 'BEEd Room 1', 30),
	((SELECT id FROM campus WHERE name = 'Castillejos'), 'BEEd-RM-2', 'BEEd Room 2', 30),
	((SELECT id FROM campus WHERE name = 'Castillejos'), 'BEEd-RM-3', 'BEEd Room 3', 30),
	((SELECT id FROM campus WHERE name = 'Castillejos'), 'BEEd-RM-4', 'BEEd Room 4', 30),
	((SELECT id FROM campus WHERE name = 'Castillejos'), 'BSBA-RM-1', 'BSBA Room 1', 30),
	((SELECT id FROM campus WHERE name = 'Castillejos'), 'BSBA-RM-2', 'BSBA Room 2', 30),

	-- Candelaria Campus
	((SELECT id FROM campus WHERE name = 'Candelaria'), 'RM101', 'Candelaria Room 101', 40),
	((SELECT id FROM campus WHERE name = 'Candelaria'), 'LAB1', 'Candelaria Computer Laboratory 1', 32),

	-- Masinloc Campus
	((SELECT id FROM campus WHERE name = 'Masinloc'), 'RM101', 'Masinloc Room 101', 40),
	((SELECT id FROM campus WHERE name = 'Masinloc'), 'LAB1', 'Masinloc Computer Laboratory 1', 32),

	-- Sta. Cruz Campus
	((SELECT id FROM campus WHERE name = 'Sta. Cruz'), 'RM101', 'Sta. Cruz Room 101', 40),
	((SELECT id FROM campus WHERE name = 'Sta. Cruz'), 'LAB1', 'Sta. Cruz Computer Laboratory 1', 32)

-- Upsert logic using the composite UNIQUE (campus_id, code) constraint
ON CONFLICT (campus_id, code)
DO UPDATE SET
	name = EXCLUDED.name,
	capacity = EXCLUDED.capacity;
