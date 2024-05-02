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

-- drop table if exists public.potential_trips cascade;
-- drop table if exists public.trips cascade;

CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY NOT NULL,
    trip_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.potential_trips (
    id UUID PRIMARY KEY NOT NULL,
    trip_name VARCHAR(255) NOT NULL,
    accommodation_log_ids VARCHAR(5000) NOT NULL,
    review_status VARCHAR(50) NOT NULL,  -- Includes 'flagged'
    review_notes VARCHAR(1000),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL
);

-- ALTER TABLE public.accommodation_logs
-- ADD COLUMN IF NOT EXISTS trip_id UUID,
-- ADD FOREIGN KEY (trip_id) REFERENCES public.trips(id);

-- ALTER TABLE public.potential_trips
-- ADD CONSTRAINT unique_trip_name_accommodation_log_ids UNIQUE (trip_name, accommodation_log_ids);


-- ALTER TABLE accommodation_logs
-- DROP CONSTRAINT accommodation_logs_potential_trip_id_fkey;

-- ALTER TABLE accommodation_logs
-- DROP COLUMN potential_trip_id;


