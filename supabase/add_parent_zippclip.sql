-- Add parent_zippclip_id column for Ride My Zipp relations
alter table zippclips add column if not exists parent_zippclip_id uuid references zippclips(id) on delete set null;

-- Index to speed up fetching rides
create index if not exists idx_zippclips_parent on zippclips(parent_zippclip_id);


