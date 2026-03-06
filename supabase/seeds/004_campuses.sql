INSERT INTO campus (code, name, address) 
VALUES 
    ('IBA', 'Iba', 'Palanginan, Iba, Zambales | 2201'),
    ('BTL', 'Botolan', 'Porac, Botolan, Zambales | 2202'),
    ('SNM', 'San Marcelino', 'Nagbunga, San Marcelino, Zambales | 2207'),
    ('CST', 'Castillejos', 'San Nicolas, Castillejos, Zambales | 2208'),
    ('CND', 'Candelaria', 'Sinabacan, Candelaria, Zambales | 2212'),
    ('MSN', 'Masinloc', 'Baloganon, Masinloc, Zambales | 2211'),
    ('STC', 'Sta. Cruz', 'Naulo, Sta. Cruz, Zambales | 2213')
ON CONFLICT (code)
DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address;
