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

-- drop table if exists public.clients cascade;
-- drop table if exists public.reservations cascade;

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    address_city VARCHAR(255),
    address_state VARCHAR(255),
    address_zip VARCHAR(255),
    address_country VARCHAR(255),
    address_apt_suite VARCHAR(255),
    cb_name VARCHAR(255),
    cb_interface_id VARCHAR(255),
    cb_profile_no VARCHAR(255),
    cb_relationship VARCHAR(255),
    cb_active VARCHAR(255),
    cb_passport_expire VARCHAR(255),
    cb_gender VARCHAR(255),
    cb_created_date DATE,
    cb_modified_date DATE,
    cb_referred_by VARCHAR(255),
    subjective_score INT,
    birth_date DATE,
    referred_by_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY NOT NULL,
    client_id UUID NOT NULL,
    num_pax INT,
    core_destination_id UUID,
    cost DECIMAL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL,
    FOREIGN KEY (client_id) REFERENCES public.clients(id),
    FOREIGN KEY (core_destination_id) REFERENCES public.core_destinations(id)
);