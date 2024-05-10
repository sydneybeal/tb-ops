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

CREATE INDEX IF NOT EXISTS idx_accommodation_logs_on_traveler_date_in ON public.accommodation_logs (primary_traveler ASC, date_in ASC);
CREATE INDEX IF NOT EXISTS idx_accommodation_logs_trip_id ON public.accommodation_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_logs_on_traveler_date_in ON public.accommodation_logs(primary_traveler, date_in, id);
CREATE INDEX IF NOT EXISTS idx_accommodation_logs_covering ON public.accommodation_logs (primary_traveler, date_in, property_id, consultant_id, booking_channel_id, agency_id) INCLUDE (id, date_out, num_pax, updated_at);
