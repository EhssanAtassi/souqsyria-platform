-- Fix column naming in audit_logs table
ALTER TABLE audit_logs 
CHANGE created_at createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
CHANGE updated_at updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6);