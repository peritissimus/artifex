"""Reproduce unacknowledged Redis delivery with Kombu, without a Celery worker.

Requires redis-server on PATH and Python packages kombu[redis]. Starts an
isolated loopback Redis process with persistence disabled, then stops it.
"""
import json
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import time
from importlib.metadata import version

import redis
from kombu import Connection

server = shutil.which("redis-server")
if not server:
    raise SystemExit("Install redis-server before running this example.")
with socket.socket() as reservation:
    reservation.bind(("127.0.0.1", 0))
    port = reservation.getsockname()[1]
with tempfile.TemporaryDirectory(prefix="redis-redelivery-") as directory:
    process = subprocess.Popen([
        server, "--bind", "127.0.0.1", "--port", str(port), "--save", "",
        "--appendonly", "no", "--dir", directory, "--loglevel", "warning",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    try:
        client = redis.Redis(host="127.0.0.1", port=port, socket_timeout=1)
        for attempt in range(100):
            if process.poll() is not None:
                raise RuntimeError("The isolated Redis process exited before startup.")
            try:
                if client.ping(): break
            except redis.ConnectionError:
                time.sleep(0.05)
        else:
            raise RuntimeError("The isolated Redis process did not start.")
        with Connection(f"redis://127.0.0.1:{port}/0", transport_options={"visibility_timeout": 1}) as connection:
            queue = connection.SimpleQueue("redelivery-example", no_ack=False)
            queue.put({"job": "fictional-demo"})
            first = queue.get(block=False)
            # Leave the first delivery unacknowledged, as a long task does.
            time.sleep(1.2)
            # Invoke Kombu's restoration check explicitly; worker polling adds
            # timing variability in a full Celery deployment.
            queue.channel.qos.restore_visible(interval=1)
            second = queue.get(block=False)
            same = first.payload == second.payload
            redelivered = bool(second.delivery_info.get("redelivered"))
            assert same and redelivered
            print(json.dumps({"same_payload": same, "redelivered": redelivered,
                              "kombu_version": version("kombu"), "redis_client_version": version("redis")}))
            second.ack()
            queue.close()
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
