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

CREATE TABLE IF NOT EXISTS public.trip_reviews (
    id UUID PRIMARY KEY NOT NULL,
    travelers JSONB,
    properties JSONB NOT NULL,
    activities JSONB NOT NULL,
    review_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL
);

CREATE INDEX idx_trip_reviews_travelers ON public.trip_reviews USING GIN (travelers);
CREATE INDEX idx_trip_reviews_properties ON public.trip_reviews USING GIN (properties);
CREATE INDEX idx_trip_reviews_activities ON public.trip_reviews USING GIN (activities);

CREATE TABLE IF NOT EXISTS public.admin_comments (
    id UUID PRIMARY KEY NOT NULL,
    trip_report_id UUID REFERENCES public.trip_reviews(id) ON DELETE CASCADE,
    comment_type VARCHAR(50) NOT NULL,  -- Type of comment, e.g., 'document_update', 'attribute_update'
    comment TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'unreviewed',
    reported_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

