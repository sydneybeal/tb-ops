from httpx import AsyncClient
from api.cmd.api.main import get_current_user
from api.services.auth.models import User
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional
from unittest.mock import AsyncMock, patch
import logging
import pytest
from fastapi import HTTPException

log = logging.getLogger("rr")


def create_test_token(email: Optional[str], secret_key: str, algorithm: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"exp": expire}
    if email is not None:
        to_encode["sub"] = email
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return encoded_jwt


async def get_test_user(ac: AsyncClient, auth_service, pw: str):
    user_data = {
        "email": "testuser@example.com",
        "password": pw,
        "role": "sales_support",
    }
    hashed_password = auth_service.hash_password(user_data["password"])
    return User(
        email=user_data["email"],
        hashed_password=hashed_password,
        role=user_data["role"],
    )


async def test_token_endpoint(ac: AsyncClient, auth_service):
    test_pw = "testpassword"
    auth_user = await get_test_user(ac, auth_service, test_pw)
    # Create the user using AuthService
    await auth_service.add_user([auth_user])
    data = {"email": auth_user.email, "password": test_pw}
    auth_res = await ac.post(url="/token", data=data)
    assert auth_res.status_code == 200
    auth_res = auth_res.json()
    assert auth_res["role"] == "sales_support"


async def test_get_current_user(mock_auth_service):
    # Generate a test token
    token = create_test_token(
        "testuser@example.com",
        mock_auth_service.SECRET_KEY,
        mock_auth_service.ALGORITHM,
    )

    # Call get_current_user directly with the mock_auth_service
    user = await get_current_user(token=token, auth_svc=mock_auth_service)

    assert user == {
        "email": "testuser@example.com",
        "password": "testpassword",
        "role": "sales_support",
    }


async def test_get_current_user_no_sub(mock_auth_service):
    # Create a token without email
    token = create_test_token(
        email=None,
        secret_key=mock_auth_service.SECRET_KEY,
        algorithm=mock_auth_service.ALGORITHM,
    )

    # retrieve the current user and get an HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(token=token, auth_svc=mock_auth_service)

    # Assert that the exception has a 401 status code
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Could not validate credentials"
    assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}


async def test_get_current_user_user_not_found(mock_auth_service):
    # simulating a non-existent user
    mock_auth_service.get_user = AsyncMock(return_value=None)

    token = create_test_token(
        email="nonexistent@example.com",
        secret_key=mock_auth_service.SECRET_KEY,
        algorithm=mock_auth_service.ALGORITHM,
    )

    # retrieve the current user and get an HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(token=token, auth_svc=mock_auth_service)

    # Assert that the exception has a 401 status code
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Could not validate credentials"
    assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}


async def test_get_current_user_jwterror(mock_auth_service):
    # Create a valid token (won't be used since jwt.decode is mocked)
    token = create_test_token(
        email="testuser@example.com",
        secret_key=mock_auth_service.SECRET_KEY,
        algorithm=mock_auth_service.ALGORITHM,
    )

    # jwt.decode to raise JWTError
    with patch("api.cmd.api.main.jwt.decode", side_effect=JWTError("Invalid token")):
        # retrieve the current user and get an HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(token=token, auth_svc=mock_auth_service)

        # Assert that the exception has a 401 status code
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Could not validate credentials"
        assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}
