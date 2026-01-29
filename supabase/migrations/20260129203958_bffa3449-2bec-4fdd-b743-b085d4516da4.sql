
-- Drop the old constraint that requires parent_id for request nodes
ALTER TABLE public.pbc_nodes DROP CONSTRAINT IF EXISTS pbc_nodes_valid_root;

-- Add new constraint: requests can have either parent_id OR object_id (or both)
-- Root nodes (department/process/area) don't need either
ALTER TABLE public.pbc_nodes ADD CONSTRAINT pbc_nodes_valid_root
CHECK (
  (parent_id IS NOT NULL) OR 
  (object_id IS NOT NULL) OR 
  (node_type IN ('department', 'process', 'area'))
);
