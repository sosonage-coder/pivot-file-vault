export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      area_document_types: {
        Row: {
          area_template_id: string
          created_at: string
          document_type_id: string
          id: string
          required: boolean
        }
        Insert: {
          area_template_id: string
          created_at?: string
          document_type_id: string
          id?: string
          required?: boolean
        }
        Update: {
          area_template_id?: string
          created_at?: string
          document_type_id?: string
          id?: string
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "area_document_types_area_template_id_fkey"
            columns: ["area_template_id"]
            isOneToOne: false
            referencedRelation: "area_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_document_types_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      area_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          process_template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          process_template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          process_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "area_templates_process_template_id_fkey"
            columns: ["process_template_id"]
            isOneToOne: false
            referencedRelation: "process_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          created_at: string
          id: string
          name: string
          process_id: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          process_id: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          process_id?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "area_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_instances: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          id: string
          items: Json
          name: string
          period_id: string | null
          reconciliation_id: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          id?: string
          items?: Json
          name: string
          period_id?: string | null
          reconciliation_id?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          id?: string
          items?: Json
          name?: string
          period_id?: string | null
          reconciliation_id?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_instances_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_instances_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_instances_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "reconciliations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_item_completions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          instance_id: string
          item_index: number
          notes: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          instance_id: string
          item_index: number
          notes?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          instance_id?: string
          item_index?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_item_completions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "checklist_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          applies_to: string[] | null
          created_at: string
          description: string | null
          id: string
          items: Json
          name: string
          updated_at: string
        }
        Insert: {
          applies_to?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          items?: Json
          name: string
          updated_at?: string
        }
        Update: {
          applies_to?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          items?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      document_approvals: {
        Row: {
          created_at: string
          document_id: string
          id: string
          notes: string | null
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          notes?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          notes?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "document_approvals_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          area_id: string
          created_at: string
          created_by: string | null
          department_id: string
          document_type_id: string
          entity_id: string
          external_file_url: string
          id: string
          logical_name: string
          notes: string | null
          object_id: string | null
          period_id: string
          process_id: string
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          version: number
        }
        Insert: {
          area_id: string
          created_at?: string
          created_by?: string | null
          department_id: string
          document_type_id: string
          entity_id: string
          external_file_url: string
          id?: string
          logical_name: string
          notes?: string | null
          object_id?: string | null
          period_id: string
          process_id: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          area_id?: string
          created_at?: string
          created_by?: string | null
          department_id?: string
          document_type_id?: string
          entity_id?: string
          external_file_url?: string
          id?: string
          logical_name?: string
          notes?: string | null
          object_id?: string | null
          period_id?: string
          process_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          area_id: string
          created_at: string
          department_id: string
          entity_id: string
          id: string
          name: string
          process_id: string
          requires_approval: boolean
          updated_at: string
        }
        Insert: {
          area_id: string
          created_at?: string
          department_id: string
          entity_id: string
          id?: string
          name: string
          process_id: string
          requires_approval?: boolean
          updated_at?: string
        }
        Update: {
          area_id?: string
          created_at?: string
          department_id?: string
          entity_id?: string
          id?: string
          name?: string
          process_id?: string
          requires_approval?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objects_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objects_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objects_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      pbc_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          pbc_item_id: string
          pbc_node_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          pbc_item_id: string
          pbc_node_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          pbc_item_id?: string
          pbc_node_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pbc_comments_pbc_item_id_fkey"
            columns: ["pbc_item_id"]
            isOneToOne: false
            referencedRelation: "pbc_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pbc_comments_pbc_node_id_fkey"
            columns: ["pbc_node_id"]
            isOneToOne: false
            referencedRelation: "pbc_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      pbc_items: {
        Row: {
          area_id: string
          assignee_id: string | null
          created_at: string
          document_type_id: string
          due_date: string | null
          entity_id: string
          id: string
          notes: string | null
          object_id: string | null
          period_id: string
          priority: string | null
          process_id: string
          status: Database["public"]["Enums"]["pbc_status"]
          updated_at: string
        }
        Insert: {
          area_id: string
          assignee_id?: string | null
          created_at?: string
          document_type_id: string
          due_date?: string | null
          entity_id: string
          id?: string
          notes?: string | null
          object_id?: string | null
          period_id: string
          priority?: string | null
          process_id: string
          status?: Database["public"]["Enums"]["pbc_status"]
          updated_at?: string
        }
        Update: {
          area_id?: string
          assignee_id?: string | null
          created_at?: string
          document_type_id?: string
          due_date?: string | null
          entity_id?: string
          id?: string
          notes?: string | null
          object_id?: string | null
          period_id?: string
          priority?: string | null
          process_id?: string
          status?: Database["public"]["Enums"]["pbc_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pbc_items_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pbc_items_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pbc_items_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pbc_items_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pbc_items_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pbc_items_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      pbc_nodes: {
        Row: {
          area_id: string | null
          assignee_id: string | null
          created_at: string
          due_date: string | null
          entity_id: string
          id: string
          label: string
          node_type: Database["public"]["Enums"]["pbc_node_type"]
          notes: string | null
          object_id: string | null
          parent_id: string | null
          pbc_template_id: string | null
          period_id: string
          priority: string | null
          sort_order: number | null
          status: Database["public"]["Enums"]["pbc_status"] | null
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          assignee_id?: string | null
          created_at?: string
          due_date?: string | null
          entity_id: string
          id?: string
          label: string
          node_type: Database["public"]["Enums"]["pbc_node_type"]
          notes?: string | null
          object_id?: string | null
          parent_id?: string | null
          pbc_template_id?: string | null
          period_id: string
          priority?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["pbc_status"] | null
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          assignee_id?: string | null
          created_at?: string
          due_date?: string | null
          entity_id?: string
          id?: string
          label?: string
          node_type?: Database["public"]["Enums"]["pbc_node_type"]
          notes?: string | null
          object_id?: string | null
          parent_id?: string | null
          pbc_template_id?: string | null
          period_id?: string
          priority?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["pbc_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pbc_nodes_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pbc_nodes_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pbc_nodes_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pbc_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pbc_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pbc_nodes_pbc_template_id_fkey"
            columns: ["pbc_template_id"]
            isOneToOne: false
            referencedRelation: "pbc_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pbc_nodes_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
        ]
      }
      pbc_templates: {
        Row: {
          allowed_sequences: Json | null
          area_type: string | null
          created_at: string
          description: string | null
          id: string
          max_depth: number
          min_depth: number
          name: string
          updated_at: string
        }
        Insert: {
          allowed_sequences?: Json | null
          area_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          max_depth?: number
          min_depth?: number
          name: string
          updated_at?: string
        }
        Update: {
          allowed_sequences?: Json | null
          area_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          max_depth?: number
          min_depth?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          label: string
          start_date: string
          type: Database["public"]["Enums"]["period_type"]
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          label: string
          start_date: string
          type: Database["public"]["Enums"]["period_type"]
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          label?: string
          start_date?: string
          type?: Database["public"]["Enums"]["period_type"]
        }
        Relationships: []
      }
      process_templates: {
        Row: {
          created_at: string
          department_id: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          department_id: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          department_id?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_templates_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          created_at: string
          department_id: string
          entity_id: string
          id: string
          name: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          entity_id: string
          id?: string
          name: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          entity_id?: string
          id?: string
          name?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "process_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_attachments: {
        Row: {
          attachment_type: string
          created_at: string
          created_by: string | null
          document_id: string
          id: string
          notes: string | null
          reconciliation_id: string
        }
        Insert: {
          attachment_type?: string
          created_at?: string
          created_by?: string | null
          document_id: string
          id?: string
          notes?: string | null
          reconciliation_id: string
        }
        Update: {
          attachment_type?: string
          created_at?: string
          created_by?: string | null
          document_id?: string
          id?: string
          notes?: string | null
          reconciliation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_attachments_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "reconciliations"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_line_items: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          line_type: string
          metadata: Json | null
          period_month: string | null
          quantity: number | null
          rate: number | null
          reconciliation_id: string
          sort_order: number | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          line_type?: string
          metadata?: Json | null
          period_month?: string | null
          quantity?: number | null
          rate?: number | null
          reconciliation_id: string
          sort_order?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          line_type?: string
          metadata?: Json | null
          period_month?: string | null
          quantity?: number | null
          rate?: number | null
          reconciliation_id?: string
          sort_order?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_line_items_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "reconciliations"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_templates: {
        Row: {
          calculation_rules: Json | null
          created_at: string
          description: string | null
          field_schema: Json | null
          id: string
          name: string
          template_content: Json | null
          template_type: string | null
          updated_at: string
        }
        Insert: {
          calculation_rules?: Json | null
          created_at?: string
          description?: string | null
          field_schema?: Json | null
          id?: string
          name: string
          template_content?: Json | null
          template_type?: string | null
          updated_at?: string
        }
        Update: {
          calculation_rules?: Json | null
          created_at?: string
          description?: string | null
          field_schema?: Json | null
          id?: string
          name?: string
          template_content?: Json | null
          template_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reconciliations: {
        Row: {
          approved_at: string | null
          certified_at: string | null
          certified_by: string | null
          created_at: string
          entity_id: string
          gl_balance: number | null
          id: string
          notes: string | null
          object_id: string
          period_id: string
          prepared_at: string | null
          preparer_id: string | null
          rejected_at: string | null
          rejection_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["reconciliation_status"]
          sub_balance: number | null
          submitted_at: string | null
          template_id: string | null
          updated_at: string
          variance: number | null
          variance_explanation: string | null
        }
        Insert: {
          approved_at?: string | null
          certified_at?: string | null
          certified_by?: string | null
          created_at?: string
          entity_id: string
          gl_balance?: number | null
          id?: string
          notes?: string | null
          object_id: string
          period_id: string
          prepared_at?: string | null
          preparer_id?: string | null
          rejected_at?: string | null
          rejection_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["reconciliation_status"]
          sub_balance?: number | null
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string
          variance?: number | null
          variance_explanation?: string | null
        }
        Update: {
          approved_at?: string | null
          certified_at?: string | null
          certified_by?: string | null
          created_at?: string
          entity_id?: string
          gl_balance?: number | null
          id?: string
          notes?: string | null
          object_id?: string
          period_id?: string
          prepared_at?: string | null
          preparer_id?: string | null
          rejected_at?: string | null
          rejection_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["reconciliation_status"]
          sub_balance?: number | null
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string
          variance?: number | null
          variance_explanation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliations_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliations_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliations_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          area_id: string | null
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          document_id: string | null
          due_date: string | null
          entity_id: string
          id: string
          object_id: string | null
          pbc_item_id: string | null
          period_id: string | null
          priority: string
          process_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          entity_id: string
          id?: string
          object_id?: string | null
          pbc_item_id?: string | null
          period_id?: string | null
          priority?: string
          process_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          entity_id?: string
          id?: string
          object_id?: string | null
          pbc_item_id?: string | null
          period_id?: string | null
          priority?: string
          process_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_pbc_item_id_fkey"
            columns: ["pbc_item_id"]
            isOneToOne: false
            referencedRelation: "pbc_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_entities: {
        Row: {
          created_at: string
          entity_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_has_entity_access: {
        Args: { _entity_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "external_reviewer"
      approval_status: "pending" | "approved" | "rejected"
      document_status: "Draft" | "Final" | "Superseded" | "Archived"
      pbc_node_type:
        | "department"
        | "process"
        | "area"
        | "dimension"
        | "object"
        | "request"
      pbc_status: "Requested" | "Uploaded" | "Reviewed" | "Complete"
      period_type: "month" | "quarter" | "year" | "phase"
      reconciliation_line_type:
        | "opening"
        | "addition"
        | "reversal"
        | "adjustment"
        | "closing"
        | "outstanding"
        | "deposit_in_transit"
        | "amortization"
        | "depreciation"
        | "interest"
        | "principal"
      reconciliation_status:
        | "not_started"
        | "in_progress"
        | "pending_review"
        | "rejected"
        | "approved"
        | "certified"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "external_reviewer"],
      approval_status: ["pending", "approved", "rejected"],
      document_status: ["Draft", "Final", "Superseded", "Archived"],
      pbc_node_type: [
        "department",
        "process",
        "area",
        "dimension",
        "object",
        "request",
      ],
      pbc_status: ["Requested", "Uploaded", "Reviewed", "Complete"],
      period_type: ["month", "quarter", "year", "phase"],
      reconciliation_line_type: [
        "opening",
        "addition",
        "reversal",
        "adjustment",
        "closing",
        "outstanding",
        "deposit_in_transit",
        "amortization",
        "depreciation",
        "interest",
        "principal",
      ],
      reconciliation_status: [
        "not_started",
        "in_progress",
        "pending_review",
        "rejected",
        "approved",
        "certified",
      ],
    },
  },
} as const
