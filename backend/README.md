# Reflecto Trend Backend

## How to deploy the backend:
1. Create .env file
```bash
		ln -s envs/production.sh ./.env
```

2. Create database in postgresql
```bash
		psql
		CREATE DATABASE reflecto;
		CREATE ROLE ref_user;
		ALTER ROLE ref_user WITH PASSWORD "secret_password";
		GRANT ALL PRIVELEGES ON DATABASE reflecto to ref_user;
```

Make sure you are able to login using psql.

3. Update the password.
	 copy-paste the above password in `.env` file and database/sqitch.conf

4. Deploy the db.
```bash
		sudo apt install sqitch
		cd database
		sqitch deploy
		## OPTIONAL
		sqitch verify
```

5. Make keys for encrypting JSON web tokens.
```bash
		mkdir keys
		cd keys
		openssl genpkey -algorithm RSA -out ./private_key.pem
		openssl rsa -pubout -in ./private_key.pem -out ./pubkey.pem
		cd ../
```

6. Update the password in 
. Build the backend
```bash
    go build -o backend .
    ./backend
```


## How to setup backend for development:

Do the steps 1 to 5 from deployment, then
```bash
		go install github.com/cosmtrek/air@latest
		air
```
