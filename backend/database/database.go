package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"reflecto.trend/models"
	"reflecto.trend/utils"
	"time"
	_ "github.com/lib/pq" // Import PostgreSQL driver
)

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
    Schema   string
}

type Service interface {
	ExecQuery(cmd string, values ...interface{}) ([]interface{}, error)
	UserExists(email string) (bool, error)
	CheckUserCreds(email string, password []byte) (int64, error)
	CreateUser(email string, password []byte) error
	CreateSocialAuthUser(email string) error
	UpdateLastLogin(id int) error
	RegisterAdmin(id int) error
	GetUserDetails(email string) (models.UserView, error)
	GetUserDetailsByID(userID int64) (*models.User, error) // Added
	IncrementAPICounter(email string) error // Added
	InsertUserPricing(userId int, pricingPlanId int, expiration time.Time) error
	GetUserPricing(userId int) (models.UserPricing, error)
	UpdateUserPricing(userId int, pricingPlanId int, expiration time.Time) error
	RetractToken(token string, expiration time.Time) error
	CheckTokenInBlackList(token string) (bool, error)
	DeleteExpiredTokens(token string) error
	UpdateEmailVerificationStatus(email string) error
	ResetPassword(email string, password []byte) error
	CreateAlert(email, symbol, condition string, targetValue float64, windowMinutes *int, repeat int) (*models.Alert, error)
	ListAlertsByUser(email string) ([]models.Alert, error)
	DeleteAlert(id int, email string) error
	UpdateAlertStatusOnly(id int, email string, status string) error
	UpdateAlertTarget(id int, email string, target float64) error
	UpdateAlertRepeat(id int, email string, repeat int) error
	ListActiveAlerts() ([]models.Alert, error)
	GetAlertByID(id int) (*models.Alert, error)
	UpdateAlertStatus(id int, status string) error
	RawDB() *sql.DB
	Close() error
}

type service struct {
	db *sql.DB
}

func NewDBConnection(Host, Port, User, Password, DBName, SSL_MODE, Schema string) (Service, error) {
	config := DatabaseConfig{
		Host:     Host,
		Port:     utils.Atoi(Port),
		User:     User,
		Password: Password,
		DBName:   DBName,
		SSLMode:  SSL_MODE,
        Schema:   Schema,
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
    _, err = db.Exec("SET search_path TO " + config.Schema + ";")
    if err != nil {
        log.Fatalf("Error setting schema: %v\n", err)
    }
	dbInstance := &service{
		db: db,
	}
	fmt.Println("Connected to database")
	return dbInstance, nil
}

func RunMigrations(db *sql.DB, migrationsDir string) error {
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("reading migrations dir: %w", err)
	}
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".sql" {
			continue
		}
		path := filepath.Join(migrationsDir, entry.Name())
		sqlBytes, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("reading migration %s: %w", entry.Name(), err)
		}
		if _, err := db.Exec(string(sqlBytes)); err != nil {
			return fmt.Errorf("executing migration %s: %w", entry.Name(), err)
		}
		log.Printf("Migration applied: %s", entry.Name())
	}
	return nil
}

func (s *service) RawDB() *sql.DB {
	return s.db
}

func (s *service) Close() error {
	log.Printf("Disconnected from database")
	return s.db.Close()
}

func (s *service) GetUserDetailsByID(userID int64) (*models.User, error) {
	query := `SELECT id, email, is_verified, is_archived, is_active FROM users WHERE id = $1`
	row := s.db.QueryRow(query, userID)

	var user models.User
	if err := row.Scan(&user.Id, &user.Email, &user.IsVerified, &user.IsArchived); err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *service) IncrementAPICounter(email string) error {
	query := `UPDATE users SET api_counter = api_counter + 1 WHERE email = $1`
	_, err := s.db.Exec(query, email)
	return err
}
