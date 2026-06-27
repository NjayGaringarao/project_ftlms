-- =========================================================
-- AMEND: identity table — replace single name column with
-- structured name fields: first_name, middle_name, last_name,
-- suffix, professional_extension.
-- =========================================================

alter table public.identity
  add column first_name text,
  add column middle_name text,
  add column last_name text,
  add column suffix text,
  add column professional_extension text;

-- Backfill: parse existing name string into parts.
-- Strategy: first word → first_name, last word → last_name (when >1 word),
-- everything in between → middle_name.
update public.identity
set
  first_name = case
    when array_length(string_to_array(trim(name), ' '), 1) >= 1
      then (string_to_array(trim(name), ' '))[1]
    else null
  end,
  middle_name = case
    when array_length(string_to_array(trim(name), ' '), 1) > 2
      then array_to_string(
        (string_to_array(trim(name), ' '))[2 : array_length(string_to_array(trim(name), ' '), 1) - 1],
        ' '
      )
    else null
  end,
  last_name = case
    when array_length(string_to_array(trim(name), ' '), 1) >= 2
      then (string_to_array(trim(name), ' '))[array_length(string_to_array(trim(name), ' '), 1)]
    else null
  end
where name is not null and trim(name) != '';

alter table public.identity drop column name;
