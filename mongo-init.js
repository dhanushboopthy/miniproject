// MongoDB initialization script - runs on first container startup
db = db.getSiblingDB('anganwadi');

// Create collections with validation schema
db.createCollection('users');
db.createCollection('children');
db.createCollection('growth_records');
db.createCollection('nutrition_logs');
db.createCollection('alerts');
db.createCollection('notification_logs');
db.createCollection('audit_logs');
db.createCollection('in_app_notifications');

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ awc_code: 1 });

db.children.createIndex({ child_id: 1 }, { unique: true });
db.children.createIndex({ awc_code: 1 });
db.children.createIndex({ date_of_birth: 1 });

db.growth_records.createIndex({ child_id: 1 });
db.growth_records.createIndex({ measurement_date: 1 });
db.growth_records.createIndex({ status: 1 });

db.nutrition_logs.createIndex({ child_id: 1 });
db.nutrition_logs.createIndex({ logged_date: 1 });

db.alerts.createIndex({ child_id: 1 });
db.alerts.createIndex({ status: 1 });
db.alerts.createIndex({ created_at: 1 });
db.alerts.createIndex({ severity: 1 });

db.audit_logs.createIndex({ user_id: 1 });
db.audit_logs.createIndex({ timestamp: 1 });
db.audit_logs.createIndex({ action: 1 });

db.in_app_notifications.createIndex({ recipient_id: 1 });
db.in_app_notifications.createIndex({ is_read: 1 });
db.in_app_notifications.createIndex({ created_at: 1 });

print('✅ Anganwadi database initialized with all collections and indexes');
