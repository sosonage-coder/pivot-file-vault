-- Add department_id column to pbc_nodes table
ALTER TABLE pbc_nodes ADD COLUMN department_id UUID REFERENCES departments(id);

-- Create index for performance
CREATE INDEX idx_pbc_nodes_department ON pbc_nodes(department_id);

-- Update existing sample data to link to Finance department
UPDATE pbc_nodes 
SET department_id = (SELECT id FROM departments WHERE name = 'Finance' LIMIT 1)
WHERE entity_id = '11111111-1111-1111-1111-111111111111';