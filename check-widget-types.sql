-- Query to check existing widget_type enum values
SELECT enumlabel as widget_type_values 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'widget_type')
ORDER BY enumsortorder;
