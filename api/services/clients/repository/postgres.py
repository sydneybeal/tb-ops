# Copyright 2024 SH

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Repositories for client-related data."""
import json
from textwrap import dedent
from typing import Iterable, Sequence, Optional, Tuple
from uuid import UUID
from api.services.clients.models import Client, ClientSummary, ReferralMatch

from api.adapters.repository import PostgresMixin
from api.services.clients.repository import ClientRepository
from api.services.clients.models import Client


class PostgresClientRepository(PostgresMixin, ClientRepository):
    """Implementation of the ClientRepository ABC for Postgres."""

    async def upsert(self, clients: Iterable[Client]) -> None:
        """Adds or updates an iterable of Client models in the repository."""
        pool = await self._get_pool()  # Assuming this retrieves an asyncpg pool
        query = dedent(
            """
            INSERT INTO public.clients (
                id, first_name, last_name, middle_name, address_line_1, address_line_2,
                address_apt_suite, address_city, address_state, address_zip, address_country,
                cb_name, cb_interface_id, cb_profile_no,
                cb_notes, cb_profile_type, cb_courtesy_title, cb_primary_agent_name, cb_salutation,
                cb_issue_country,
                cb_relationship, cb_active,
                cb_passport_expire, cb_gender, cb_created_date, cb_modified_date, cb_referred_by,
                subjective_score, birth_date, referral_type, referred_by_id, referred_by_name, notes,
                num_referrals, audited, created_at, updated_at, updated_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31,
                $32, $33, $34
            )
            ON CONFLICT (id) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                middle_name = EXCLUDED.middle_name,
                address_line_1 = EXCLUDED.address_line_1,
                address_line_2 = EXCLUDED.address_line_2,
                address_apt_suite = EXCLUDED.address_apt_suite,
                address_city = EXCLUDED.address_city,
                address_state = EXCLUDED.address_state,
                address_zip = EXCLUDED.address_zip,
                address_country = EXCLUDED.address_country,
                cb_name = EXCLUDED.cb_name,
                cb_interface_id = EXCLUDED.cb_interface_id,
                cb_profile_no = EXCLUDED.cb_profile_no,
                cb_notes = EXCLUDED.cb_notes,
                cb_profile_type = EXCLUDED.cb_profile_type,
                cb_courtesy_title = EXCLUDED.cb_courtesy_title,
                cb_primary_agent_name = EXCLUDED.cb_primary_agent_name,
                cb_salutation = EXCLUDED.cb_salutation,
                cb_issue_country = EXCLUDED.cb_issue_country,
                cb_active = EXCLUDED.cb_active,
                cb_passport_expire = EXCLUDED.cb_passport_expire,
                cb_gender = EXCLUDED.cb_gender,
                cb_created_date = EXCLUDED.cb_created_date,
                cb_modified_date = EXCLUDED.cb_modified_date,
                cb_referred_by = EXCLUDED.cb_referred_by,
                subjective_score = EXCLUDED.subjective_score,
                birth_date = EXCLUDED.birth_date,
                referral_type = EXCLUDED.referral_type,
                referred_by_id = EXCLUDED.referred_by_id,
                referred_by_name = EXCLUDED.referred_by_name,
                notes = EXCLUDED.notes,
                num_referrals = EXCLUDED.num_referrals,
                audited = EXCLUDED.audited,
                updated_at = EXCLUDED.updated_at,
                updated_by = EXCLUDED.updated_by
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                args = [
                    (
                        client.id,
                        client.first_name.strip() if client.first_name else None,
                        client.last_name.strip() if client.last_name else None,
                        client.middle_name.strip() if client.middle_name else None,
                        (
                            client.address_line_1.strip()
                            if client.address_line_1
                            else None
                        ),
                        (
                            client.address_line_2.strip()
                            if client.address_line_2
                            else None
                        ),
                        (
                            client.address_apt_suite.strip()
                            if client.address_apt_suite
                            else None
                        ),
                        client.address_city.strip() if client.address_city else None,
                        client.address_state.strip() if client.address_state else None,
                        client.address_zip.strip() if client.address_zip else None,
                        (
                            client.address_country.strip()
                            if client.address_country
                            else None
                        ),
                        client.cb_name.strip() if client.cb_name else None,
                        (
                            client.cb_interface_id.strip()
                            if client.cb_interface_id
                            else None
                        ),
                        client.cb_profile_no.strip() if client.cb_profile_no else None,
                        client.cb_notes.strip() if client.cb_notes else None,
                        (
                            client.cb_profile_type.strip()
                            if client.cb_profile_type
                            else None
                        ),
                        (
                            client.cb_courtesy_title.strip()
                            if client.cb_courtesy_title
                            else None
                        ),
                        (
                            client.cb_primary_agent_name.strip()
                            if client.cb_primary_agent_name
                            else None
                        ),
                        client.cb_salutation.strip() if client.cb_salutation else None,
                        (
                            client.cb_issue_country.strip()
                            if client.cb_issue_country
                            else None
                        ),
                        (
                            client.cb_relationship.strip()
                            if client.cb_relationship
                            else None
                        ),
                        client.cb_active.strip() if client.cb_active else None,
                        (
                            client.cb_passport_expire.strip()
                            if client.cb_passport_expire
                            else None
                        ),
                        client.cb_gender.strip() if client.cb_gender else None,
                        client.cb_created_date,
                        client.cb_modified_date,
                        (
                            client.cb_referred_by.strip()
                            if client.cb_referred_by
                            else None
                        ),
                        client.subjective_score,
                        client.birth_date,
                        client.referral_type,
                        client.referred_by_id,
                        (
                            client.referred_by_name.strip()
                            if client.referred_by_name
                            else None
                        ),
                        (client.notes.strip() if client.notes else None),
                        client.num_referrals,
                        client.audited,
                        client.created_at,
                        client.updated_at,
                        client.updated_by.strip(),
                    )
                    for client in clients
                ]
                await con.executemany(query, args)
        print(f"Successfully processed {len(args)} Client record(s) in the repository.")

    async def upsert_referral(self, client: Client) -> list[Tuple[UUID, bool]]:
        """Adds or updates an iterable of Client models in the repository."""
        pool = await self._get_pool()  # Assuming this retrieves an asyncpg pool
        query = dedent(
            """
            INSERT INTO public.clients (
                id, first_name, last_name, referral_type, referred_by_id, referred_by_name,
                notes, cb_primary_agent_name, audited, deceased, should_contact, do_not_contact,
                moved_business, created_at, updated_at, updated_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
            )
            ON CONFLICT (id) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                referral_type = EXCLUDED.referral_type,
                referred_by_id = EXCLUDED.referred_by_id,
                referred_by_name = EXCLUDED.referred_by_name,
                notes = EXCLUDED.notes,
                cb_primary_agent_name = EXCLUDED.cb_primary_agent_name,
                audited = EXCLUDED.audited,
                deceased = EXCLUDED.deceased,
                should_contact = EXCLUDED.should_contact,
                do_not_contact = EXCLUDED.do_not_contact,
                moved_business = EXCLUDED.moved_business,
                updated_at = EXCLUDED.updated_at,
                updated_by = EXCLUDED.updated_by
            RETURNING id, (xmax = 0) AS was_inserted;
            """
        )
        results = []
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                args = (
                    client.id,
                    client.first_name.strip() if client.first_name else None,
                    client.last_name.strip() if client.last_name else None,
                    client.referral_type,
                    client.referred_by_id,
                    (
                        client.referred_by_name.strip()
                        if client.referred_by_name
                        else None
                    ),
                    (client.notes.strip() if client.notes else None),
                    client.cb_primary_agent_name,
                    client.audited,
                    client.deceased,
                    client.should_contact,
                    client.do_not_contact,
                    client.moved_business,
                    client.created_at,
                    client.updated_at,
                    client.updated_by,
                )
                row = await con.fetchrow(query, *args)
                if row:
                    # Append log ID and whether it was an insert (True) or an update (False)
                    results.append((row["id"], row["was_inserted"]))
        # Initialize counters
        inserted_count = 0
        updated_count = 0

        # Process the results to count inserts and updates
        for _, was_inserted in results:
            if was_inserted:
                inserted_count += 1
            else:
                updated_count += 1

        print(f"Processed {len(results)} upsert operation(s).")
        print(f"Inserted {inserted_count} new client(s).")
        print(f"Updated {updated_count} existing client(s).")
        return results

    async def get(self) -> Sequence[Client]:
        """Returns Clients in the repository."""
        pool = await self._get_pool()  # Assuming this retrieves an asyncpg pool
        query = dedent(
            """
            SELECT * FROM public.clients
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query)
                clients = [Client(**record) for record in records]
                return clients

    async def get_by_id(self, client_id: UUID) -> Optional[Client]:
        """Returns Client in the repository by ID."""
        pool = await self._get_pool()  # Assuming this retrieves an asyncpg pool
        query = dedent(
            """
            SELECT * FROM public.clients
            WHERE id = $1
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(query, client_id)
                if res:
                    return Client(**res)

    async def get_summaries(self) -> Sequence[ClientSummary]:
        """Returns ClientSummary instances in the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT 
                c.id,
                c.first_name,
                c.last_name,
                c.middle_name,
                c.address_line_1,
                c.address_line_2,
                c.address_apt_suite,
                c.address_city,
                c.address_state,
                c.address_zip,
                c.address_country,
                c.cb_name,
                c.cb_interface_id,
                c.cb_profile_no,
                c.cb_notes,
                c.cb_profile_type,
                c.cb_courtesy_title,
                c.cb_primary_agent_name,
                c.cb_salutation,
                c.cb_issue_country,
                c.cb_relationship,
                c.cb_active,
                c.cb_passport_expire,
                c.cb_gender,
                c.cb_created_date,
                c.cb_modified_date,
                c.cb_referred_by,
                c.cb_marketing_sources,
                c.subjective_score,
                c.birth_date,
                c.referral_type,
                c.referred_by_id,
                c.referred_by_name,
                c.notes,
                r.first_name AS referred_by_first_name,
                r.last_name AS referred_by_last_name,
                coalesce(ag.name, empl.email, r.last_name || '/' || r.first_name) AS name_of_referred_by_id,
                COUNT(distinct ref.id) AS referrals_count,
                c.audited,
                c.deceased,
                c.should_contact,
                c.do_not_contact,
                c.moved_business,
                c.created_at,
                c.updated_at,
                c.updated_by
            FROM public.clients AS c
            LEFT JOIN public.clients AS r ON c.referred_by_id = r.id
            LEFT JOIN public.clients AS ref ON c.referred_by_id = ref.id
            LEFT JOIN public.agencies AS ag ON c.referred_by_id = ag.id
            LEFT JOIN public.users AS empl ON c.referred_by_id = empl.id
            GROUP BY c.id, r.first_name, r.last_name, ag.name, empl.email
            """
        )
        async with pool.acquire() as con:
            async with con.transaction():
                records = await con.fetch(query)
                client_summaries = [ClientSummary(**record) for record in records]
                return client_summaries

    async def get_referral_matches(self) -> Sequence[ReferralMatch]:
        """Returns ClientSummary instances in the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            with res_info as (
            select
                client_id,
                MIN(start_date) as earliest_trip,
                MAX(start_date) as latest_trip,
                count(*) as num_trips,
                SUM(cost) as total_trip_spend,
                AVG(cost) as avg_trip_spend,
                extract(year
            from
                AGE(NOW(),
                MAX(start_date))) * 12 + extract(month
            from
                AGE(NOW(),
                MAX(start_date))) as months_since_last_reservation
            from
                public.reservations
            group by
                client_id
            )
            select
                source_client.id as source_client_id,
                source_client.cb_name as source_client_cb_name,
                source_client.birth_date as source_client_birth_date,
                source_res_info.avg_trip_spend as source_client_avg_trip_spend,
                source_res_info.total_trip_spend as source_client_total_trip_spend,
                source_res_info.earliest_trip as source_client_earliest_trip,
                source_res_info.latest_trip as source_client_latest_trip,
                source_res_info.num_trips as source_client_num_trips,
                new_client.id as new_client_id,
                new_client.cb_name as new_client_cb_name,
                new_client.birth_date as new_client_birth_date,
                new_res_info.avg_trip_spend as new_client_avg_trip_spend,
                new_res_info.total_trip_spend as new_client_total_trip_spend,
                new_res_info.earliest_trip as new_client_earliest_trip,
                new_res_info.latest_trip as new_client_latest_trip,
                new_res_info.num_trips as new_client_num_trips
            from
                public.clients source_client
            join public.clients new_client
            on
                new_client.referred_by_id = source_client.id
            join res_info new_res_info
            on
                new_res_info.client_id = new_client.id
            join res_info source_res_info
            on
                source_res_info.client_id = source_client.id
            """
        )
        async with pool.acquire() as con:
            async with con.transaction():
                records = await con.fetch(query)
                referral_matches = [ReferralMatch(**record) for record in records]
                return referral_matches
