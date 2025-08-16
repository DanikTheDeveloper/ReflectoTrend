package database

import (
    "time"
    "reflecto.trend/models"
    "golang.org/x/crypto/bcrypt"
)


func (db *UserDB) ExecQuery(cmd string, values ...interface{}) ([]interface{}, error) {
    var rows []interface{}
    err := db.QueryRow(cmd, values...).Scan(&rows)
    if err != nil {
        return nil, err
    }
    return rows, nil
}

func (db *UserDB) UserExists(email string) (bool, error) {
    var exists bool
    err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", email).Scan(&exists)
    if err != nil {
        return false, err
    }
    return exists, nil
}

// Convert the hashed password from the database to byte slice as required by bcrypt.CompareHashAndPassword
func compareHashAndPassword(hashedPwdFromDB string, plainPwd []byte) bool {
    byteHash := []byte(hashedPwdFromDB)

    err := bcrypt.CompareHashAndPassword(byteHash, plainPwd)
    if err != nil {
        return false
    }

    return true
}

func (db *UserDB) CheckUserCreds(email string, password []byte) (int64, error) {
    var id int64
    var passwordFromDB string
    err := db.QueryRow("SELECT id, password FROM users WHERE email=$1 and is_social=$2", email, false).Scan(&id, &passwordFromDB)
    if err != nil {
        return -1, err
    }

    if !compareHashAndPassword(passwordFromDB, password) {
        return -1, nil
    }
    return id, nil
}

func (db *UserDB) CreateUser(email string, password []byte) error {
    current_timestamp := time.Now()

    var newUserId int
    err := db.QueryRow(`INSERT INTO users (email, password, status, created_at, updated_at, last_login, is_social)
                        VALUES ($1, $2, 'active', $3, $3, $3, $4) RETURNING id`,
                        email, password, current_timestamp, false).Scan(&newUserId)
    if err != nil {
        return err
    }

	defaultPricingPlanID := 1
	expiration := time.Now().Add(30 * 24 * time.Hour)
	err = db.InsertUserPricing(newUserId, defaultPricingPlanID, expiration)
    if err != nil {
        return err
    }

    return nil
}

func (db *UserDB) CreateSocialAuthUser(email string) error {
    current_timestamp := time.Now()

    var newUserId int
    err := db.QueryRow(`INSERT INTO users (email, status, created_at, updated_at, last_login, is_social)
                        VALUES ($1, 'active', $2, $2, $2, $3) RETURNING id`,
                        email, current_timestamp, true).Scan(&newUserId)
    if err != nil {
        return err
    }
    _, err = db.Exec("INSERT INTO social_auth (user_id, provider) VALUES ($1, $2)", newUserId, "google")
    if err != nil {
        return err
    }

    defaultPricingPlanID := 1
	expiration := time.Now().Add(30 * 24 * time.Hour)
	err = db.InsertUserPricing(newUserId, defaultPricingPlanID, expiration)
    if err != nil {
        return err
    }

    return nil
}

func (db *UserDB) UpdateLastLogin(id int) error {
    current_timestamp := time.Now()
    _, err := db.Exec("UPDATE users SET last_login=$1 WHERE id=$2", current_timestamp, id)
    if err != nil {
        return err
    }
    return nil
}


func (db *UserDB) RegisterAdmin(id int) error {
    _, err := db.Exec("UPDATE users SET is_admin=$1 WHERE id=$2", true, id)
    if err != nil {
        return err
    }
    return nil
}

func (db *UserDB) GetUserDetails(email string) (models.UserView, error) {
    var user models.UserView
    err := db.QueryRow("SELECT id, email, status, is_admin, is_social, created_at, updated_at, last_login FROM users WHERE email=$1", email).Scan(&user.Id, &user.Email, &user.Status, &user.IsAdmin, &user.IsSocial, &user.CreatedAt, &user.UpdatedAt, &user.LastLogin)
    if err != nil {
        return models.UserView{}, err
    }
    return user, nil
}


// Pricing Plan:

// InsertUserPricing inserts a new record into the UserPricing table.
func (db *UserDB) InsertUserPricing(userId int, pricingPlanId int, expiration time.Time) error {
    _, err := db.Exec(`INSERT INTO user_pricing (user_id, pricing_plan_id, expiration) VALUES ($1, $2, $3)`,
                     userId, pricingPlanId, expiration)
    return err
}

// GetUserPricing fetches the current pricing plan of a user.
func (db *UserDB) GetUserPricing(userId int) (models.UserPricing, error) {
    var userPricing models.UserPricing
    err := db.QueryRow(`SELECT user_id, pricing_plan_id, expiration FROM user_pricing WHERE user_id=$1`, userId).
             Scan(&userPricing.UserId, &userPricing.PricingPlanId, &userPricing.Expiration)
    if err != nil {
        return models.UserPricing{}, err
    }
    return userPricing, nil
}

// UpdateUserPricing updates the pricing plan of a user.
func (db *UserDB) UpdateUserPricing(userId int, pricingPlanId int, expiration time.Time) error {
    _, err := db.Exec(`UPDATE user_pricing SET pricing_plan_id=$1, expiration=$2 WHERE user_id=$3`,
                     pricingPlanId, expiration, userId)
    return err
}

func (db *UserDB) RetractToken(token string, expiration time.Time) error {
    _, err := db.Exec(`INSERT INTO blacklist_token (token, expiration) VALUES ($1, $2)`, token, expiration)
    return err
}

func (db *UserDB) CheckTokenInBlackList(token string) (bool, error) {
    var exists bool
    err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM blacklist_token WHERE token=$1)", token).Scan(&exists)
    if err != nil {
        return false, err
    }
    return exists, nil
}

func (db *UserDB) DeleteExpiredTokens(token string) error {
    _, err := db.Exec("DELETE FROM blacklist_token WHERE expiration < $1", time.Now())
    return err
}

