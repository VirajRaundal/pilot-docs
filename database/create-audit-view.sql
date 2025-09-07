-- Create the missing audit_logs_with_details view
-- This view is required for the AuditLog component to work properly

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
GRANT SELECT ON audit_logs_with_details TO authenticated;

-- Create RLS policy for the view
ALTER TABLE audit_logs_with_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_audit_logs_with_details" ON audit_logs_with_details FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid()::TEXT 
            AND ur.role IN ('admin', 'inspector')
        )
        OR user_id = auth.uid()
    );