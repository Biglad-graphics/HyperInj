import ssl
import uvicorn
from main import app  # adjust path if your main file is in app/main.py

if __name__ == "__main__":
    cert_file = "/etc/ssl/cloudflare/origin-cert.pem"
    key_file = "/etc/ssl/cloudflare/origin-key.pem"

    ssl_ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_ctx.load_cert_chain(certfile=cert_file, keyfile=key_file)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=443,
        ssl_context=ssl_ctx,
    )