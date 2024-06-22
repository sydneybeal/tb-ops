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

-- DROP TABLE IF EXISTS public.trip_reviews CASCADE;
-- DROP TABLE IF EXISTS public.admin_comments CASCADE;

CREATE TABLE IF NOT EXISTS public.trip_reviews (
    id UUID PRIMARY KEY NOT NULL,
    travelers JSONB,
    properties JSONB,
    activities JSONB,
    review_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trip_reviews_travelers ON public.trip_reviews USING GIN (travelers);
CREATE INDEX IF NOT EXISTS idx_trip_reviews_properties ON public.trip_reviews USING GIN (properties);
CREATE INDEX IF NOT EXISTS idx_trip_reviews_activities ON public.trip_reviews USING GIN (activities);

CREATE TABLE IF NOT EXISTS public.admin_comments (
    id UUID PRIMARY KEY NOT NULL,
    trip_report_id UUID REFERENCES public.trip_reviews(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    comment_type VARCHAR(50),  -- Type of comment, e.g., 'document_update', 'attribute_update'
    comment TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'unreviewed',
    reported_by JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_trip_report_property 
ON public.admin_comments (trip_report_id, COALESCE(property_id, '00000000-0000-0000-0000-000000000000'::uuid));