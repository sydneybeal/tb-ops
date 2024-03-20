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

CREATE INDEX IF NOT EXISTS idx_countries_core_destination_id ON public.countries(core_destination_id);

CREATE INDEX IF NOT EXISTS idx_properties_portfolio_id ON public.properties(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_properties_core_destination_id ON public.properties(core_destination_id);
CREATE INDEX IF NOT EXISTS idx_properties_country_id ON public.properties(country_id);

CREATE INDEX IF NOT EXISTS idx_accommodation_logs_date_in ON public.accommodation_logs(date_in);
CREATE INDEX IF NOT EXISTS dx_accommodation_logs_date_out ON public.accommodation_logs(date_out);
CREATE INDEX IF NOT EXISTS idx_accommodation_logs_property_date ON public.accommodation_logs(property_id, date_in, date_out);
CREATE INDEX IF NOT EXISTS idx_accommodation_logs_updated_at ON public.accommodation_logs(updated_at);
