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
"""API tests."""

from httpx import AsyncClient
from uuid import uuid4
import logging
import pytest


log = logging.getLogger("rr")


async def add_client(
    ac: AsyncClient,
    first_name: str,
    last_name: str,
):
    data = {
        "client_id": None,
        "first_name": first_name,
        "last_name": last_name,
        "referral_type": None,
        "referred_by_id": None,
        "referred_by_name": None,
        "audited": False,
        "cb_primary_agent_name": None,
        "deceased": False,
        "should_contact": False,
        "do_not_contact": False,
        "moved_business": False,
        "notes": None,
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/clients", json=data)
    assert res.json() == {"inserted_count": 1, "updated_count": 0}


async def patch_client_referral(
    ac: AsyncClient,
    new_client: dict,
    referring_client_id: str | None = None,
):
    data = {
        "client_id": new_client["id"],
        "first_name": new_client["first_name"],
        "last_name": new_client["last_name"],
        "referred_by_id": referring_client_id,
        "referral_type": None,
        "referred_by_name": None,
        "audited": False,
        "cb_primary_agent_name": None,
        "deceased": False,
        "should_contact": False,
        "do_not_contact": False,
        "moved_business": False,
        "notes": None,
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/clients", json=data)
    assert res.status_code == 200
    return res.json()


async def get_clients(ac: AsyncClient):
    res = await ac.get(url="/v1/clients")
    return res.json()


async def test_add_client_referrals(ac: AsyncClient):
    # Seed two clients
    await add_client(ac, first_name="Original", last_name="Client")
    await add_client(ac, first_name="New", last_name="Client")

    # Get the list of clients
    client_res = await get_clients(ac)
    print(client_res)
    assert len(client_res) == 2

    # Filter clients based on their first name
    original_client = next(
        client for client in client_res if client["first_name"] == "Original"
    )
    new_client = next(client for client in client_res if client["first_name"] == "New")

    # Patch the new client to be referred by the original client
    patch_res = await patch_client_referral(
        ac, new_client=new_client, referring_client_id=original_client["id"]
    )

    # Assert the response of the patch request is successful
    assert patch_res == {"inserted_count": 0, "updated_count": 1}

    # Get the clients again to verify the referral
    updated_client_res = await get_clients(ac)
    updated_new_client = next(
        client for client in updated_client_res if client["first_name"] == "New"
    )

    # Assert that the new client's 'referred_by_id' matches the original client's ID
    assert updated_new_client["referred_by_id"] == original_client["id"]


async def test_get_clients(ac: AsyncClient):
    res = await ac.get(url="/v1/clients")
    assert res.status_code == 200


async def test_patch_client_existing_client(ac: AsyncClient):
    client_res = await ac.get(url=f"/v1/clients")
    sample_client = client_res.json()[0]
    referring_client = client_res.json()[1]
    data = {
        "client_id": sample_client["id"],
        "first_name": sample_client["first_name"],
        "last_name": sample_client["last_name"],
        "referred_by_id": referring_client["id"],
        "referral_type": "existing_client",
        "referred_by_name": None,
        "audited": False,
        "cb_primary_agent_name": sample_client["cb_primary_agent_name"],
        "deceased": False,
        "should_contact": False,
        "do_not_contact": False,
        "moved_business": False,
        "notes": None,
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/clients", json=data)
    assert res.status_code == 200
    res = res.json()
    log.info(res)
