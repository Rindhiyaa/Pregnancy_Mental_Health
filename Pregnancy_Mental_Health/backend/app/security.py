from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    # bcrypt max is 72 bytes; safely truncate if longer
    trimmed = password[:72]
    return pwd_context.hash(trimmed)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)