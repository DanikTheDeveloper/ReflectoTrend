// general functions that do db functions

package database

import (
    "database/sql"
    "fmt"
    "log"
    "reflecto.trend/utils"
    _ "github.com/lib/pq" // Import PostgreSQL driver
)

type DatabaseConfig struct {
    Host     string
    Port     int
    User     string
    Password string
    DBName   string
    SSLMode  string
}

type UserDB struct {
    *sql.DB
}

// NewUserDB creates a new instance of NewDB.
func NewUserDB(db *sql.DB) *UserDB {
    return &UserDB{db}
}


// NewDBConnection creates a new database connection and returns the db object.data
func NewDBConnection(Host, Port, User, Password, DBName, SSL_MODE string) (*UserDB, error) {
    config := DatabaseConfig{
        Host:     Host,
        Port:     utils.Atoi(Port),
        User:     User,
        Password: Password,
        DBName:   DBName,
        SSLMode:  SSL_MODE,
    }

    connStr := fmt.Sprintf(
        "host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
        config.Host, config.Port, config.User, config.Password, config.DBName, config.SSLMode,
    )

    db, err := sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal(err)
        return nil, err
    }

    // Try to ping the database to check the connection
    err = db.Ping()
    if err != nil {
        log.Fatal(err)
        return nil, err
    }

    userDB := NewUserDB(db)

    fmt.Println("Successfully connected to the database!")

    return userDB, nil
}

