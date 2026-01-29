-- Update root constraint: now department, process, or area can be root for flexible depth
ALTER TABLE pbc_nodes DROP CONSTRAINT IF EXISTS pbc_nodes_area_is_root;
ALTER TABLE pbc_nodes ADD CONSTRAINT pbc_nodes_valid_root CHECK (
  parent_id IS NOT NULL OR node_type IN ('department', 'process', 'area')
);