-- Gardırop uygulaması veritabanı şeması
-- Supabase panelinde: SQL Editor > New query > bu dosyanın tamamını yapıştır > Run

-- Kıyafetler
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text,
  category text not null,
  color text,
  season text,
  image_path text not null,
  created_at timestamptz not null default now()
);

-- Kombinler (seçilen kıyafetlerin id listesi)
create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  item_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Takvim planı: her gün için bir kombin
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  outfit_id uuid not null references public.outfits on delete cascade,
  date date not null,
  unique (user_id, date)
);

-- Güvenlik: her kullanıcı yalnızca kendi verisini görür ve değiştirir
alter table public.items   enable row level security;
alter table public.outfits enable row level security;
alter table public.plans   enable row level security;

create policy "Kendi kıyafetlerim" on public.items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Kendi kombinlerim" on public.outfits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Kendi planlarım" on public.plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Fotoğraf deposu
insert into storage.buckets (id, name, public)
values ('wardrobe', 'wardrobe', true)
on conflict (id) do nothing;

-- Kullanıcı yalnızca kendi klasörüne (<user_id>/...) yükleyip silebilir
create policy "Kendi klasörüme yükle" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Kendi fotoğraflarımı sil" on storage.objects
  for delete to authenticated
  using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);
