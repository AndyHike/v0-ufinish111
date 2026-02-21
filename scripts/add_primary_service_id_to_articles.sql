-- Add primary_service_id column to articles table
ALTER TABLE articles ADD COLUMN primary_service_id UUID;

-- Add foreign key constraint
ALTER TABLE articles 
ADD CONSTRAINT fk_articles_primary_service_id 
FOREIGN KEY (primary_service_id) 
REFERENCES services(id) 
ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_articles_primary_service_id ON articles(primary_service_id);
