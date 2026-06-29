#!/bin/bash
echo 'TURSO_DATABASE_URL="libsql://youfet-nustech.aws-ap-northeast-1.turso.io"
TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzczMDE0NzIsImlkIjoiMDE5ZGNmM2QtYjgwMS03OWQ5LWE5ODMtNDI2NjIyZWRiNmYxIiwicmlkIjoiMWI5NmY4ZDAtMTE4Mi00YTYwLThiMWItYjg0OWE3Y2FjOWE2In0.WhzxxZACFFGO9G9La237RujWlksTjQKWYY7YHF8fSgQHcTiMcfG8Xd20adnq_MNSrtNQmMcO1gcfulaEXm1JDw"' > /home/z/my-project/.env
chmod 444 /home/z/my-project/.env
echo "✅ .env restored and protected"
