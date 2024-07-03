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
CREATE TABLE IF NOT EXISTS public.daily_rates (
    base_currency CHAR(3) NOT NULL,
    target_currency CHAR(3) NOT NULL,
    currency_name VARCHAR(255),
    conversion_rate NUMERIC(10, 6),
    rate_date DATE,
    rate_time TIME,
    PRIMARY KEY (base_currency, target_currency, rate_date)
);