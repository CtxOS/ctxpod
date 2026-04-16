import time
import redis
import logging
import uuid
from contextlib import contextmanager

logger = logging.getLogger("DistLocks")

r = redis.Redis(host="redis", port=6379, decode_responses=True)

class RedisLock:
    """
    Simple distributed lock using Redis SET NX.
    """
    def __init__(self, lock_name, timeout=10, expire=30):
        self.lock_name = f"lock:{lock_name}"
        self.timeout = timeout
        self.expire = expire
        self.token = str(uuid.uuid4())

    def acquire(self):
        end = time.time() + self.timeout
        while time.time() < end:
            if r.set(self.lock_name, self.token, nx=True, ex=self.expire):
                return True
            time.sleep(0.1)
        return False

    def release(self):
        # Only release if we still own it (via token)
        script = """
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        """
        r.eval(script, 1, self.lock_name, self.token)

@contextmanager
def distributed_lock(name, timeout=5, expire=15):
    lock = RedisLock(name, timeout, expire)
    if lock.acquire():
        try:
            yield
        finally:
            lock.release()
    else:
        logger.warning(f"Could not acquire lock: {name}")
        yield False
