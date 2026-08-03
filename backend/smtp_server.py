import asyncio

async def handle_client(reader, writer):
    print("SMTP connection received.")
    writer.write(b"220 localhost ESMTP Postfix\r\n")
    await writer.drain()

    mail_data = []
    in_data = False

    try:
        while True:
            line_bytes = await reader.readline()
            if not line_bytes:
                break
            line = line_bytes.decode('utf-8', errors='ignore').strip()
            
            if in_data:
                if line == ".":
                    in_data = False
                    writer.write(b"250 OK: Message accepted for delivery\r\n")
                    await writer.drain()
                    print("\n=== EMAIL RECEIVED ===")
                    print("\n".join(mail_data))
                    print("======================\n")
                    mail_data = []
                else:
                    mail_data.append(line)
            else:
                cmd = line.split()[0].upper() if line else ""
                if cmd in ("HELO", "EHLO"):
                    writer.write(b"250-localhost, hello\r\n250-8BITMIME\r\n250 OK\r\n")
                elif cmd == "MAIL":
                    writer.write(b"250 OK\r\n")
                elif cmd == "RCPT":
                    writer.write(b"250 OK\r\n")
                elif cmd == "DATA":
                    in_data = True
                    writer.write(b"354 Start mail input; end with <CRLF>.<CRLF>\r\n")
                elif cmd == "QUIT":
                    writer.write(b"221 Bye\r\n")
                    await writer.drain()
                    break
                else:
                    writer.write(b"250 OK\r\n")
                await writer.drain()
    except Exception as e:
        print(f"Error handling SMTP client: {e}")
    finally:
        writer.close()
        await writer.wait_closed()

async def main():
    server = await asyncio.start_server(handle_client, '127.0.0.1', 1025)
    print("Local SMTP server listening on 127.0.0.1:1025...")
    async with server:
        await server.serve_forever()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("SMTP server stopped.")
