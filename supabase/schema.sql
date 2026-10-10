-- Kisaan Setu database schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query.
-- Review before applying to an existing project.

create extension if not exists pgcrypto;
create extension if not exists postgis;

do $$ begin
  create type public.app_role as enum ('farmer', 'fpo', 'buyer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.listing_status as enum ('available', 'reserved', 'sold', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.offer_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'farmer',
  buyer_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_prices (
  id uuid primary key default gen_random_uuid(),
  crop text not null,
  market_name text not null,
  district text not null,
  state text not null default 'West Bengal',
  price_per_quintal numeric(12,2) not null check (price_per_quintal >= 0),
  arrival_volume numeric(14,2),
  quality_grade text,
  observed_on date not null default current_date,
  source text not null default 'manual_import',
  created_at timestamptz not null default now()
);
create index if not exists market_prices_crop_district_date_idx
  on public.market_prices (crop, district, observed_on desc);

create table if not exists public.produce_listings (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.profiles(id) on delete restrict,
  crop text not null,
  variety text,
  quantity_quintals numeric(12,2) not null check (quantity_quintals > 0),
  expected_price_per_quintal numeric(12,2) check (expected_price_per_quintal is null or expected_price_per_quintal >= 0),
  quality_grade text,
  harvest_date date,
  pickup_district text not null,
  pickup_state text not null default 'West Bengal',
  pickup_location geography(point, 4326),
  status public.listing_status not null default 'available',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists produce_listings_crop_status_idx
  on public.produce_listings (crop, status);
create index if not exists produce_listings_location_idx
  on public.produce_listings using gist (pickup_location);

create table if not exists public.buyer_offers (
  id uuid primary key default gen_random_uuid(),
  produce_listing_id uuid not null references public.produce_listings(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  offered_price_per_quintal numeric(12,2) not null check (offered_price_per_quintal > 0),
  quantity_quintals numeric(12,2) not null check (quantity_quintals > 0),
  message text,
  status public.offer_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists buyer_offers_listing_idx on public.buyer_offers (produce_listing_id, created_at desc);
create index if not exists buyer_offers_buyer_idx on public.buyer_offers (buyer_id, created_at desc);

-- Create a safe default profile after Supabase Auth registration.
-- Users may choose farmer/fpo/buyer at signup; admin is never accepted from metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'farmer');
  if requested_role not in ('farmer', 'fpo', 'buyer') then requested_role := 'farmer'; end if;
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    requested_role::public.app_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.market_prices enable row level security;
alter table public.produce_listings enable row level security;
alter table public.buyer_offers enable row level security;

-- Public/anonymous users may read market prices. Only server-side trusted imports should write prices.
drop policy if exists "Anyone can read market prices" on public.market_prices;
create policy "Anyone can read market prices" on public.market_prices
  for select to anon, authenticated using (true);

-- A user can read and update their own profile, but cannot promote themselves or verify themselves.
drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "Update own basic profile" on public.profiles;
create policy "Update own basic profile" on public.profiles
  for update to authenticated using (auth.uid() = id)
  with check (auth.uid() = id and role <> 'admin' and buyer_verified = false);

-- Anyone can browse available listings. Only the owner can manage their listing.
drop policy if exists "Read available listings" on public.produce_listings;
create policy "Read available listings" on public.produce_listings
  for select to anon, authenticated using (status = 'available' or farmer_id = auth.uid());

drop policy if exists "Farmers create own listings" on public.produce_listings;
create policy "Farmers create own listings" on public.produce_listings
  for insert to authenticated with check (
    farmer_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('farmer','fpo'))
  );

drop policy if exists "Owners update own listings" on public.produce_listings;
create policy "Owners update own listings" on public.produce_listings
  for update to authenticated using (farmer_id = auth.uid())
  with check (farmer_id = auth.uid());

-- Offers are private to the buyer who made them and the farmer who owns the listing.
drop policy if exists "Offer parties can read offers" on public.buyer_offers;
create policy "Offer parties can read offers" on public.buyer_offers
  for select to authenticated using (
    buyer_id = auth.uid()
    or exists (select 1 from public.produce_listings l where l.id = produce_listing_id and l.farmer_id = auth.uid())
  );

-- Offer creation through the API additionally checks buyer verification.
-- Do not expose the service-role key to browsers.
-- Admin buyer verification should be performed through a separate protected admin-only operation.
