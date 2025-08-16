#!/bin/bash

# Going inside the backend directory
cd backend

# Run postgre
sudo service postgresql start

# Removing if exists
rm -f .env

# Stop the script if any command fails
set -e

# Step 1: Create .env file
ln -s envs/staging-env.sh ./.env

# Step 2: Create database in PostgreSQL
# This will require manual password input for the PostgreSQL user
# psql -U postgres -c "CREATE DATABASE reflecto;"
# psql -U postgres -c "CREATE ROLE ref_user;"
# psql -U postgres -c "ALTER ROLE ref_user WITH PASSWORD 'BigHomeWaterBottle';"
# psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE reflecto TO ref_user;"

# Step 3: Update the password in .env file and database/sqitch.conf
# Placeholder for updating .env and sqitch.conf. This might need manual intervention.

# Step 4: Deploy the db
# sudo apt install sqitch -y
cd database
# sqitch deploy
# Optional step
# sqitch verify
cd ..

# Step 5: Make keys for JWT
mkdir -p keys
cd keys
# openssl genpkey -algorithm RSA -out ./private_key.pem
# openssl rsa -pubout -in ./private_key.pem -out ./pubkey.pem
cd ..

# Step 6: Build the backend
go build -o backend .
nohup ./backend &

# Navigating to the frontend directory
cd ../frontend

# Deploying Frontend for Development
# Step 7: Install dependencies and run the dev server
yarn install --force
nohup yarn run serve &

# Building for Production
# Step 8: Build the frontend for production
# yarn run build && echo "Frontend production build complete and successful."