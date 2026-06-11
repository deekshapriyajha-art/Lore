ALTER TABLE chunks ADD COLUMN IF NOT EXISTS fts tsvector;

UPDATE chunks SET fts = to_tsvector('english', content);

CREATE INDEX IF NOT EXISTS chunks_fts_idx ON chunks USING GIN(fts);

CREATE OR REPLACE FUNCTION chunks_fts_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.fts := to_tsvector('english', NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER chunks_fts_trigger
    BEFORE INSERT OR UPDATE ON chunks
    FOR EACH ROW EXECUTE FUNCTION chunks_fts_update();