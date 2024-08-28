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

"""Services for interacting with reservation entries."""
# from typing import Optional, Sequence, Union
from uuid import UUID
from datetime import datetime
from typing import Iterable, Union, Sequence, Optional
from api.services.clients.models import (
    Client,
    ClientSummary,
    PatchClientRequest,
    ReferralMatch,
    ReferralNode,
)
from api.services.clients.repository.postgres import PostgresClientRepository
from api.services.reservations.service import ReservationService


class ClientService:
    """Service for interfacing with the client repository."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._repo = PostgresClientRepository()
        self._reservation_service = ReservationService()

    async def add(self, clients: Union[Client, Iterable[Client]]) -> None:
        """Adds new Client to the repository."""
        if isinstance(clients, Client):
            clients = [clients]
        await self._repo.upsert(clients)

    async def process_patch_request(self, client_request: PatchClientRequest) -> None:
        """Adds new Client to the repository."""
        existing_client_by_id = None
        if client_request.client_id:
            # Fetch existing client by ID
            existing_client_by_id = await self.get_by_id(client_request.client_id)
        if existing_client_by_id:
            print(f"Found existing client {existing_client_by_id.cb_name}")
            client_to_upsert = existing_client_by_id
            client_to_upsert.referred_by_id = client_request.referred_by_id
            print(
                f"Setting client {client_to_upsert.cb_name} to referred by {client_request.referred_by_id}"
            )
        else:
            # TODO: create new client with patch request info
            client_to_upsert = Client(
                first_name=client_request.first_name,
                last_name=client_request.last_name,
                updated_by=client_request.updated_by,
            )
            print(
                f"Creating new client {client_request.last_name}/{client_request.first_name}"
            )
        await self._repo.upsert([client_to_upsert])

    async def get(
        self,
    ) -> Sequence[Client]:
        """Returns Clients from the repository."""
        return await self._repo.get()

    async def get_by_id(self, client_id: UUID) -> Optional[Client]:
        """Returns Client from the repository by ID."""
        return await self._repo.get_by_id(client_id)

    async def get_summaries(
        self,
    ) -> Sequence[ClientSummary]:
        """Returns ClientSummary instances from the repository."""
        client_summaries = await self._repo.get_summaries()
        reservations = await self._reservation_service.get()
        # Create a dictionary to map client_id to reservations
        reservations_by_client_id = {}
        for res in reservations:
            if res.client_id not in reservations_by_client_id:
                reservations_by_client_id[res.client_id] = []
            reservations_by_client_id[res.client_id].append(res)

        # Attach reservations to their respective client summaries
        for summary in client_summaries:
            if summary.id in reservations_by_client_id:
                summary.reservations = reservations_by_client_id[summary.id]
            else:
                summary.reservations = []

        return client_summaries

    async def get_referral_matches(
        self,
    ) -> Sequence[ReferralMatch]:
        """Returns Clients from the repository."""
        return await self._repo.get_referral_matches()

    async def get_referral_tree(
        self,
    ) -> Sequence[ReferralNode]:
        """Returns Clients from the repository."""
        # get Sequence[ReferralMatch] from repository
        referrals = await self._repo.get_referral_matches()
        referrals_converted = [ref.model_dump() for ref in referrals]

        # Build the referral tree
        referral_tree = self.build_referral_tree(referrals_converted)
        referral_nodes = [ReferralNode(**referral_tree[key]) for key in referral_tree]

        return referral_nodes

    def build_referral_tree(self, referrals) -> dict:
        referral_tree = {}
        referred_by_map = {}

        # Initialize the referral tree and the referred_by_map
        for referral in referrals:
            source_id = referral["source_client_id"]
            new_id = referral["new_client_id"]

            if source_id not in referral_tree:
                referral_tree[source_id] = {
                    "id": source_id,
                    "name": referral["source_client_cb_name"],
                    "birth_date": referral["source_client_birth_date"],
                    "total_spend": referral["source_client_total_trip_spend"],
                    "avg_spend": referral["source_client_avg_trip_spend"],
                    "earliest_trip": referral["source_client_earliest_trip"],
                    "latest_trip": referral["source_client_latest_trip"],
                    "num_trips": referral["source_client_num_trips"],
                    "children": [],
                }

            referred_by_map[new_id] = {
                "id": new_id,
                "name": referral["new_client_cb_name"],
                "birth_date": referral["new_client_birth_date"],
                "total_spend": referral["new_client_total_trip_spend"],
                "avg_spend": referral["new_client_avg_trip_spend"],
                "earliest_trip": referral["new_client_earliest_trip"],
                "latest_trip": referral["new_client_latest_trip"],
                "num_trips": referral["new_client_num_trips"],
                "parent_id": source_id,
            }

        # Recursively build the tree
        def add_children(node, visited_ids):
            node_id = node["id"]
            visited_ids.add(node_id)  # Add current node to the visited set

            for child_id, child_data in referred_by_map.items():
                if child_data["parent_id"] == node_id and child_id not in visited_ids:
                    child_node = {
                        "id": child_data["id"],
                        "name": child_data["name"],
                        "birth_date": child_data["birth_date"],
                        "total_spend": child_data["total_spend"],
                        "avg_spend": child_data["avg_spend"],
                        "earliest_trip": child_data["earliest_trip"],
                        "latest_trip": child_data["latest_trip"],
                        "num_trips": child_data["num_trips"],
                        "children": [],
                    }
                    node["children"].append(child_node)
                    add_children(
                        child_node, visited_ids.copy()
                    )  # Recursive call to add descendants

        # Build the tree from root nodes
        for source_id, source_data in referral_tree.items():
            add_children(source_data, set())

        # Optionally handle mutual referrals as before (if still necessary)

        return referral_tree
