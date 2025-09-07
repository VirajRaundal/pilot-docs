-- Comprehensive Audit Logging System
-- Created for Day 4 compliance requirements

-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID,
    action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'UPLOAD', 'DOWNLOAD', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT')),
    user_id UUID,
    user_email TEXT,
    user_role TEXT CHECK (user_role IN ('pilot', 'admin', 'inspector')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs (action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs (record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs (user_email);

-- Create composite index for filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_filter ON audit_logs (created_at DESC, table_name, action_type, user_id);

-- Function to get current user context
CREATE OR REPLACE FUNCTION get_current_user_context()
RETURNS TABLE(user_id UUID, user_email TEXT, user_role TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid()::UUID,
        auth.email()::TEXT,
        ur.role::TEXT
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()::TEXT
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    user_context RECORD;
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[] := '{}';
    field_name TEXT;
BEGIN
    -- Get current user context
    SELECT * INTO user_context FROM get_current_user_context();
    
    -- Determine old and new values based on operation
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        new_data = NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data = NULL;
        new_data = to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
        
        -- Identify changed fields
        FOR field_name IN SELECT jsonb_object_keys(new_data) LOOP
            IF old_data->>field_name IS DISTINCT FROM new_data->>field_name THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action_type,
        user_id,
        user_email,
        user_role,
        old_values,
        new_values,
        changed_fields,
        metadata
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE((NEW.id)::UUID, (OLD.id)::UUID),
        TG_OP,
        user_context.user_id,
        user_context.user_email,
        user_context.user_role,
        old_data,
        new_data,
        changed_fields,
        jsonb_build_object(
            'trigger_name', TG_NAME,
            'schema_name', TG_TABLE_SCHEMA
        )
    );
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for all main tables
DROP TRIGGER IF EXISTS audit_documents_trigger ON documents;
CREATE TRIGGER audit_documents_trigger
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_pilots_trigger ON pilots;
CREATE TRIGGER audit_pilots_trigger
    AFTER INSERT OR UPDATE OR DELETE ON pilots
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_user_roles_trigger ON user_roles;
CREATE TRIGGER audit_user_roles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Function to log custom actions (approvals, uploads, etc.)
CREATE OR REPLACE FUNCTION log_custom_action(
    p_table_name TEXT,
    p_record_id UUID,
    p_action_type TEXT,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    user_context RECORD;
    audit_id UUID;
BEGIN
    -- Get current user context
    SELECT * INTO user_context FROM get_current_user_context();
    
    -- Insert custom audit record
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action_type,
        user_id,
        user_email,
        user_role,
        metadata
    ) VALUES (
        p_table_name,
        p_record_id,
        p_action_type,
        user_context.user_id,
        user_context.user_email,
        user_context.user_role,
        p_metadata
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit logs with filters
CREATE OR REPLACE FUNCTION get_audit_logs(
    p_table_name TEXT DEFAULT NULL,
    p_action_type TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    table_name TEXT,
    record_id UUID,
    action_type TEXT,
    user_id UUID,
    user_email TEXT,
    user_role TEXT,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.table_name,
        al.record_id,
        al.action_type,
        al.user_id,
        al.user_email,
        al.user_role,
        al.old_values,
        al.new_values,
        al.changed_fields,
        al.ip_address,
        al.user_agent,
        al.metadata,
        al.created_at
    FROM audit_logs al
    WHERE 
        (p_table_name IS NULL OR al.table_name = p_table_name)
        AND (p_action_type IS NULL OR al.action_type = p_action_type)
        AND (p_user_id IS NULL OR al.user_id = p_user_id)
        AND (p_start_date IS NULL OR al.created_at >= p_start_date)
        AND (p_end_date IS NULL OR al.created_at <= p_end_date)
    ORDER BY al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit statistics
CREATE OR REPLACE FUNCTION get_audit_statistics(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
    total_actions INTEGER,
    actions_by_type JSONB,
    actions_by_user JSONB,
    actions_by_table JSONB,
    daily_activity JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*)::INTEGER as total,
            jsonb_object_agg(action_type, action_count) as by_type,
            jsonb_object_agg(user_email, user_count) as by_user,
            jsonb_object_agg(table_name, table_count) as by_table,
            jsonb_object_agg(activity_date, daily_count) as daily
        FROM (
            SELECT 
                action_type,
                COUNT(*) as action_count,
                user_email,
                COUNT(*) OVER (PARTITION BY user_email) as user_count,
                table_name,
                COUNT(*) OVER (PARTITION BY table_name) as table_count,
                DATE(created_at) as activity_date,
                COUNT(*) OVER (PARTITION BY DATE(created_at)) as daily_count
            FROM audit_logs
            WHERE created_at BETWEEN p_start_date AND p_end_date
        ) subq
        GROUP BY ()
    )
    SELECT 
        s.total,
        s.by_type,
        s.by_user,
        s.by_table,
        s.daily
    FROM stats s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view audit logs based on their role
CREATE POLICY "view_audit_logs" ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid()::TEXT 
            AND ur.role IN ('admin', 'inspector')
        )
        OR user_id = auth.uid()
    );

-- Policy: Only admins can delete audit logs (for cleanup)
CREATE POLICY "admin_delete_audit_logs" ON audit_logs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid()::TEXT 
            AND ur.role = 'admin'
        )
    );

-- Create a view for easier querying with user details
CREATE OR REPLACE VIEW audit_logs_with_details AS
SELECT 
    al.*,
    p.first_name,
    p.last_name,
    p.pilot_license,
    CASE 
        WHEN al.table_name = 'documents' THEN d.title
        WHEN al.table_name = 'pilots' THEN p.first_name || ' ' || p.last_name
        ELSE al.table_name
    END as record_description
FROM audit_logs al
LEFT JOIN pilots p ON p.user_id::TEXT = al.user_id::TEXT
LEFT JOIN documents d ON d.id = al.record_id
ORDER BY al.created_at DESC;

-- Grant permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON audit_logs_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION log_custom_action TO authenticated;

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system actions';
COMMENT ON FUNCTION audit_trigger_function() IS 'Generic trigger function for automatic audit logging';
COMMENT ON FUNCTION log_custom_action IS 'Function to manually log custom actions like approvals';
COMMENT ON FUNCTION get_audit_logs IS 'Function to retrieve filtered audit logs';
COMMENT ON FUNCTION get_audit_statistics IS 'Function to get audit statistics and summaries';