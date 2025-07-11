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

-- drop table if exists public.accommodation_logs cascade;
-- drop table if exists public.properties cascade;
-- drop table if exists public.consultants;
-- drop table if exists public.portfolios;
-- drop table if exists public.booking_channels;
-- drop table if exists public.agencies;
-- drop table if exists public.countries;
-- drop table if exists public.core_destinations;
-- drop table if exists public.audit_logs;
-- drop table if exists public.property_details;

CREATE TABLE IF NOT EXISTS public.core_destinations (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS public.countries (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    core_destination_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL,
    FOREIGN KEY (core_destination_id) REFERENCES public.core_destinations(id)
);

CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS public.booking_channels (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS public.consultants (
    id UUID NOT NULL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL,
    UNIQUE (first_name, last_name)
);

CREATE TABLE IF NOT EXISTS public.properties (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    portfolio_id UUID NOT NULL,
    core_destination_id UUID NOT NULL,
    country_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL,
    FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id),
    FOREIGN KEY (core_destination_id) REFERENCES public.core_destinations(id),
    FOREIGN KEY (country_id) REFERENCES public.countries(id),
    UNIQUE (name, portfolio_id, country_id, core_destination_id)
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL,
    FOREIGN KEY (property_id) REFERENCES public.properties(id),
    FOREIGN KEY (consultant_id) REFERENCES public.consultants(id),
    FOREIGN KEY (booking_channel_id) REFERENCES public.booking_channels(id),
    FOREIGN KEY (agency_id) REFERENCES public.agencies(id),
    UNIQUE (primary_traveler, property_id, date_in, date_out)
);