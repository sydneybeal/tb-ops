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

-- DROP TABLE public.core_destinations CASCADE;
-- DROP TABLE public.countries CASCADE;
-- DROP TABLE public.agencies CASCADE;
-- DROP TABLE public.booking_channels CASCADE;
-- DROP TABLE public.consultants CASCADE;
-- DROP TABLE public.properties CASCADE;
-- DROP TABLE public.accommodation_logs CASCADE;

CREATE TABLE IF NOT EXISTS public.core_destinations (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS public.countries (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    core_destination_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL,
    FOREIGN KEY (core_destination_id) REFERENCES public.core_destinations(id)
);

CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS public.booking_channels (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS public.consultants (
    id UUID NOT NULL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL,
    UNIQUE (first_name, last_name)
);

CREATE TABLE IF NOT EXISTS public.properties (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    portfolio VARCHAR(255),
    representative VARCHAR(255),
    core_destination_id UUID NOT NULL,
    country_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL,
    FOREIGN KEY (core_destination_id) REFERENCES public.core_destinations(id),
    FOREIGN KEY (country_id) REFERENCES public.countries(id),
    UNIQUE (name, portfolio, country_id, core_destination_id)
);

CREATE TABLE IF NOT EXISTS public.accommodation_logs (
    id UUID NOT NULL PRIMARY KEY,
    property_id UUID NOT NULL,
    consultant_id UUID NOT NULL,
    primary_traveler VARCHAR(255) NOT NULL,
    num_pax INT NOT NULL,
    date_in DATE NOT NULL,
    date_out DATE NOT NULL,
    booking_channel_id UUID,
    agency_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL,
    FOREIGN KEY (property_id) REFERENCES public.properties(id),
    FOREIGN KEY (consultant_id) REFERENCES public.consultants(id),
    FOREIGN KEY (booking_channel_id) REFERENCES public.booking_channels(id),
    FOREIGN KEY (agency_id) REFERENCES public.agencies(id),
    UNIQUE (primary_traveler, property_id, date_in, date_out)
);