-- optional migration to add a boolean flag for vehicles
-- this makes it easier to query rather than relying on the name prefix

ALTER TABLE patrimonies
    ADD COLUMN IF NOT EXISTS is_vehicle BOOLEAN DEFAULT FALSE;

-- you can update existing rows that should be treated as vehicles,
-- e.g. those whose name or description contains 'Veiculo':

UPDATE patrimonies
SET is_vehicle = TRUE
WHERE name ILIKE '%veiculo%' OR description ILIKE '%veiculo%';
