
-- Create unique index on nome+contato (case-insensitive, trimmed) to prevent duplicates at DB level
CREATE UNIQUE INDEX idx_leads_unique_nome_contato ON leads (LOWER(TRIM(nome)), LOWER(TRIM(contato)));
