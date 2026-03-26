from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt", "argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    # bcrypt max is 72 bytes; safely truncate if longer
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password) 