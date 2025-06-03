-- Copyright 2024 SH

-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at

--     http://www.apache.org/licenses/LICENSE-2.0

-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS lead_source VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS inquiry_date DATE NULL,
ADD COLUMN IF NOT EXISTS deposit_date DATE NULL,
-- default 90 days before trip_start_date
ADD COLUMN IF NOT EXISTS final_payment_date DATE NULL,
ADD COLUMN IF NOT EXISTS sell_price DECIMAL NULL,
ADD COLUMN IF NOT EXISTS cost_from_suppliers DECIMAL NULL,
-- allow notes for things like "referral fee only" when it is an edge case with no attached bed nights
ADD COLUMN IF NOT EXISTS notes VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS flights_handled_by VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS full_coverage_policy BOOLEAN NULL,
ADD COLUMN IF NOT EXISTS travel_advisor_id UUID NULL
;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_travel_advisor_id'
      AND table_schema = 'public'
      AND table_name = 'trips'
  ) THEN
    ALTER TABLE public.trips
      ADD CONSTRAINT fk_travel_advisor_id
      FOREIGN KEY (travel_advisor_id)
      REFERENCES public.users(id);
  END IF;
END;
$$;