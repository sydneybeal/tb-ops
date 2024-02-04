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

"""REST API entrypoint code for TB Operations."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def make_app() -> FastAPI:
    """Function to build FastAPI app."""
    app = FastAPI(
        title="tb_ops_api_layer",
        version="0.0.1",
        docs_url="/docs",
        openapi_url="/openapi.json",
        servers=[
            {
                "url": "https://www.ops.travelbeyond.com",
                "description": "TB Operations API",
            },
        ],
        description="Travel Beyond.",
        openapi_tags=[
            {
                "name": "service_providers",
                "description": "Bed night reporting for client trips.",
            },
        ],
    )

    origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    def root():
        return {"Hello": "World"}

    return app


if __name__ == "__main__":
    import uvicorn

    app = make_app()

    uvicorn.run(app, host="0.0.0.0", port=9900)
