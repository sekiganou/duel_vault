#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Seeding DB..."
npm run seed

echo "Starting server..."
npm run start