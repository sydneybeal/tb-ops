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

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS property_type VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6) NULL,
ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6) NULL,
ADD COLUMN IF NOT EXISTS location VARCHAR(255) NULL;