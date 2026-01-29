-- Add 'department' and 'process' to pbc_node_type enum
ALTER TYPE pbc_node_type ADD VALUE IF NOT EXISTS 'department' BEFORE 'area';
ALTER TYPE pbc_node_type ADD VALUE IF NOT EXISTS 'process' BEFORE 'area';