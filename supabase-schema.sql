-- Supabase Database Schema for Databackup Web
-- Run this SQL in your Supabase SQL Editor

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL CHECK (department IN ('IT', 'HR', 'Finance')),
  role TEXT NOT NULL CHECK (role IN ('admin', 'department_user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  userId UUID REFERENCES auth.users(id),
  department TEXT NOT NULL,
  action TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  username TEXT,
  resourceType TEXT,
  resourceId TEXT,
  resourceName TEXT,
  filename TEXT,
  fileSize BIGINT,
  fileType TEXT,
  changes JSONB,
  ipAddress INET,
  userAgent TEXT,
  metadata JSONB
);

-- File backups metadata table
CREATE TABLE IF NOT EXISTS backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  department TEXT NOT NULL,
  uploadedBy UUID REFERENCES auth.users(id),
  uploadDate TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  fileSize BIGINT NOT NULL,
  downloadURL TEXT NOT NULL,
  path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  industry TEXT,
  size TEXT CHECK (size IN ('startup', 'small', 'medium', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('lead', 'prospect', 'active', 'inactive', 'lost')),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  address_country TEXT,
  annual_revenue DECIMAL(12,2),
  contract_value DECIMAL(10,2),
  currency TEXT DEFAULT 'ZMW',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'planning', 'creative', 'approval', 'active', 'completed', 'paused')),
  budget_total DECIMAL(10,2),
  budget_spent DECIMAL(10,2) DEFAULT 0,
  budget_currency TEXT DEFAULT 'ZMW',
  start_date DATE,
  end_date DATE,
  channels TEXT[],
  manager_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  campaign_id UUID REFERENCES campaigns(id),
  type TEXT NOT NULL CHECK (type IN ('client', 'campaign', 'department', 'project')),
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'ZMW',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'active', 'completed')),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Projects table (for team management)
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id),
  campaign_id UUID REFERENCES campaigns(id),
  status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'on-hold', 'completed')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  manager_id UUID REFERENCES auth.users(id),
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'review', 'completed')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID[] DEFAULT '{}',
  due_date DATE,
  estimated_hours DECIMAL(4,1),
  actual_hours DECIMAL(4,1) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Media assets table (for MediaLibrary)
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document')),
  department TEXT NOT NULL,
  uploadedBy UUID REFERENCES auth.users(id),
  uploadDate TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  fileSize BIGINT NOT NULL,
  downloadURL TEXT NOT NULL,
  path TEXT NOT NULL,
  tags TEXT,
  clientId UUID REFERENCES clients(id),
  campaignId UUID REFERENCES campaigns(id),
  projectId UUID REFERENCES projects(id),
  license TEXT,
  expirationDate DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_userId ON logs(userId);
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
CREATE INDEX IF NOT EXISTS idx_backups_department ON backups(department);
CREATE INDEX IF NOT EXISTS idx_backups_uploadedBy ON backups(uploadedBy);
CREATE INDEX IF NOT EXISTS idx_media_assets_department ON media_assets(department);
CREATE INDEX IF NOT EXISTS idx_media_assets_uploadedBy ON media_assets(uploadedBy);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(type);

-- Indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_client_id ON campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_manager_id ON campaigns(manager_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);

-- Indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_industry ON clients(industry);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);

-- Indexes for budgets
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_campaign_id ON budgets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_budgets_type ON budgets(type);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_created_by ON budgets(created_by);

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_campaign_id ON projects(campaign_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Only admins can view all users
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update their own profile (role changes are handled in application logic)
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only admins can delete users (except themselves)
DROP POLICY IF EXISTS "Admins can delete users" ON users;
CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    ) AND id != auth.uid()
  );

-- RLS Policies for logs table
-- Only admins can view logs
DROP POLICY IF EXISTS "Admins can view logs" ON logs;
CREATE POLICY "Admins can view logs" ON logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow inserts for authenticated users (for activity logging)
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON logs;
CREATE POLICY "Authenticated users can insert logs" ON logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for backups table
-- Users can view files from their department or if they're admin
DROP POLICY IF EXISTS "Users can view department files" ON backups;
CREATE POLICY "Users can view department files" ON backups
  FOR SELECT USING (
    department = (SELECT department FROM users WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can insert files for their department
DROP POLICY IF EXISTS "Users can insert department files" ON backups;
CREATE POLICY "Users can insert department files" ON backups
  FOR INSERT WITH CHECK (
    department = (SELECT department FROM users WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can update their own files or admins can update any
DROP POLICY IF EXISTS "Users can update their files" ON backups;
CREATE POLICY "Users can update their files" ON backups
  FOR UPDATE USING (
    uploadedBy = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can delete their own files or admins can delete any
DROP POLICY IF EXISTS "Users can delete their files" ON backups;
CREATE POLICY "Users can delete their files" ON backups
  FOR DELETE USING (
    uploadedBy = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for media_assets table
-- Users can view media from their department or if they're admin
DROP POLICY IF EXISTS "Users can view department media" ON media_assets;
CREATE POLICY "Users can view department media" ON media_assets
  FOR SELECT USING (
    department = (SELECT department FROM users WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can insert media for their department
DROP POLICY IF EXISTS "Users can insert department media" ON media_assets;
CREATE POLICY "Users can insert department media" ON media_assets
  FOR INSERT WITH CHECK (
    department = (SELECT department FROM users WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can update their own media or admins can update any
DROP POLICY IF EXISTS "Users can update their media" ON media_assets;
CREATE POLICY "Users can update their media" ON media_assets
  FOR UPDATE USING (
    uploadedBy = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can delete their own media or admins can delete any
DROP POLICY IF EXISTS "Users can delete their media" ON media_assets;
CREATE POLICY "Users can delete their media" ON media_assets
  FOR DELETE USING (
    uploadedBy = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Enable RLS for new tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns table
DROP POLICY IF EXISTS "Admins can view all campaigns" ON campaigns;
CREATE POLICY "Admins can view all campaigns" ON campaigns
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can insert campaigns" ON campaigns;
CREATE POLICY "Admins can insert campaigns" ON campaigns
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update campaigns" ON campaigns;
CREATE POLICY "Admins can update campaigns" ON campaigns
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete campaigns" ON campaigns;
CREATE POLICY "Admins can delete campaigns" ON campaigns
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for clients table
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can insert clients" ON clients;
CREATE POLICY "Admins can insert clients" ON clients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update clients" ON clients;
CREATE POLICY "Admins can update clients" ON clients
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete clients" ON clients;
CREATE POLICY "Admins can delete clients" ON clients
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for budgets table
DROP POLICY IF EXISTS "Admins can view all budgets" ON budgets;
CREATE POLICY "Admins can view all budgets" ON budgets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can insert budgets" ON budgets;
CREATE POLICY "Admins can insert budgets" ON budgets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update budgets" ON budgets;
CREATE POLICY "Admins can update budgets" ON budgets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete budgets" ON budgets;
CREATE POLICY "Admins can delete budgets" ON budgets
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for projects table
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
CREATE POLICY "Admins can view all projects" ON projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can insert projects" ON projects;
CREATE POLICY "Admins can insert projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update projects" ON projects;
CREATE POLICY "Admins can update projects" ON projects
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete projects" ON projects;
CREATE POLICY "Admins can delete projects" ON projects
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for tasks table
DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
CREATE POLICY "Admins can view all tasks" ON tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can insert tasks" ON tasks;
CREATE POLICY "Admins can insert tasks" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update tasks" ON tasks;
CREATE POLICY "Admins can update tasks" ON tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete tasks" ON tasks;
CREATE POLICY "Admins can delete tasks" ON tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, department, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'department', 'IT'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'department_user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent unauthorized role changes
CREATE OR REPLACE FUNCTION public.prevent_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow role changes if the user is an admin (this would need to be checked via auth context)
  -- For now, we'll allow role changes but log them
  -- In production, you might want to add proper admin checks here
  IF OLD.role != NEW.role THEN
    -- Log the role change (you could insert into logs table here if needed)
    RAISE NOTICE 'Role changed from % to % for user %', OLD.role, NEW.role, NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on users table
DROP TRIGGER IF EXISTS set_updated_at_users ON users;
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger to update updated_at on media_assets table
DROP TRIGGER IF EXISTS set_updated_at_media_assets ON media_assets;
CREATE TRIGGER set_updated_at_media_assets
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger to update updated_at on campaigns table
DROP TRIGGER IF EXISTS set_updated_at_campaigns ON campaigns;
CREATE TRIGGER set_updated_at_campaigns
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger to update updated_at on clients table
DROP TRIGGER IF EXISTS set_updated_at_clients ON clients;
CREATE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger to update updated_at on budgets table
DROP TRIGGER IF EXISTS set_updated_at_budgets ON budgets;
CREATE TRIGGER set_updated_at_budgets
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger to update updated_at on projects table
DROP TRIGGER IF EXISTS set_updated_at_projects ON projects;
CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger to update updated_at on tasks table
DROP TRIGGER IF EXISTS set_updated_at_tasks ON tasks;
CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger to handle role changes (optional - logs role changes)
DROP TRIGGER IF EXISTS prevent_role_changes ON users;
CREATE TRIGGER prevent_role_changes
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_changes();