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

"""Generates referral tree based on the referred_by_id in the database."""
import asyncio
import csv
import matplotlib.pyplot as plt
import networkx as nx
import sys
from api.services.clients.service import ClientService
from api.services.clients.models import Client

# sys.setrecursionlimit(10000)


class ReferralTree:

    def __init__(self):
        self._client_svc = ClientService()
        self.raw_data = {
            "referral_data": self.read_csv("clients", "client_referrals"),
        }

    def build_referral_tree(self, referrals):
        referral_tree = {}
        referred_by_map = {}

        for referral in referrals:
            source_id = referral["source_client_id"]
            new_id = referral["new_client_id"]

            if source_id not in referral_tree:
                referral_tree[source_id] = {
                    "name": referral["source_client_cb_name"],
                    "spend": referral["source_client_total_trip_spend"],
                    "children": [],
                }

            referral_tree[source_id]["children"].append(
                {
                    "id": new_id,
                    "name": referral["new_client_cb_name"],
                    "spend": referral["new_client_total_trip_spend"],
                }
            )

            # Record who referred whom
            referred_by_map[new_id] = source_id

        # Check for mutual referrals and resolve them alphabetically
        to_remove = []
        for new_id, source_id in referred_by_map.items():
            if source_id in referred_by_map and referred_by_map[source_id] == new_id:
                # Get the names of both clients
                source_name = referral_tree[source_id]["name"]
                new_name = referral_tree[new_id]["name"]

                if new_name.lower() < source_name.lower():
                    # If the new client's name comes first, they should be the referrer
                    # Remove the original referral and swap roles
                    referral_tree[new_id]["children"].append(
                        {
                            "id": source_id,
                            "name": source_name,
                            "spend": referral_tree[source_id]["spend"],
                        }
                    )
                    # Remove the original child from the source_id's children list
                    referral_tree[source_id]["children"] = [
                        child
                        for child in referral_tree[source_id]["children"]
                        if child["id"] != new_id
                    ]
                    # Update the referred_by_map
                    referred_by_map[source_id] = new_id
                    to_remove.append(new_id)

        # Remove the swapped entries from the referred_by_map
        for new_id in to_remove:
            referred_by_map.pop(new_id, None)

        return referral_tree

    def detect_circular_references(self, referral_tree):
        visited = set()

        def visit(node_id, path):
            if node_id in path:
                print(f"Circular reference detected: {path + [node_id]}")
                return True
            if node_id in visited:
                return False

            visited.add(node_id)
            path.append(node_id)

            for child in referral_tree.get(node_id, {}).get("children", []):
                if visit(child["id"], path.copy()):
                    return True

            path.pop()
            return False

        for root_id in referral_tree:
            if visit(root_id, []):
                break

    async def generate_referral_tree(self):
        # referrals = self.raw_data["referral_data"]
        referral_objs = await self._client_svc.get_referral_matches()
        referrals = [ref.model_dump() for ref in referral_objs]

        # Build the referral tree and resolve mutual referrals
        referral_tree = self.build_referral_tree(referrals)
        print(referral_tree)

        # Use NetworkX to create a graph
        G = nx.DiGraph()

        # Add nodes and edges iteratively
        for source_id, node_data in referral_tree.items():
            G.add_node(source_id, label=node_data["name"])
            for child in node_data["children"]:
                G.add_node(child["id"], label=child["name"])
                G.add_edge(source_id, child["id"])

        # Debugging: Print all nodes and their labels
        # print("Nodes with labels:")
        # for node in G.nodes(data=True):
        #     print(node)

        # print("\nEdges:")
        # for edge in G.edges(data=True):
        #     print(edge)

        try:
            # Attempt to use a hierarchical layout (top-down)
            pos = nx.nx_pydot.pydot_layout(G, prog="dot")
        except (IndexError, nx.NetworkXError) as e:
            print(f"Error in generating layout with 'dot': {e}")
            print("Falling back to spring layout...")
            # Fallback to a spring layout if 'dot' fails
            pos = nx.spring_layout(G)

        # Draw the graph using the determined layout
        labels = nx.get_node_attributes(G, "label")
        plt.figure(figsize=(15, 15))  # Adjust the figure size as needed
        nx.draw(
            G,
            pos,
            with_labels=True,
            labels=labels,
            node_size=3000,
            node_color="lightblue",
            font_size=10,
            font_weight="bold",
            arrows=True,
        )
        plt.show()

    def read_csv(self, genre, file_name) -> list[dict]:
        """Parses a CSV given a file name."""
        data = []
        encoding = "utf-8" if "blah" in file_name else "utf-8-sig"
        line_number = 0
        last_row = ""
        try:
            with open(
                f"/Users/sydney-horan/tb-ops/seed/{genre}/{file_name}.csv",
                encoding=encoding,
            ) as csv_file:
                reader = csv.DictReader(csv_file)
                for row in reader:
                    line_number += 1  # Increment line counter
                    last_row = row
                    if None in row.keys():
                        row.pop(None, None)
                    data.append(row)
        except UnicodeDecodeError as e:
            print(f"Error decoding file {file_name}.csv at line {line_number}: {e}")
            print(f"Last row: {last_row}")
            # Optionally, return data collected so far or handle the error differently
            raise
        return data


if __name__ == "__main__":
    referral_tree = ReferralTree()
    asyncio.run(referral_tree.generate_referral_tree())
