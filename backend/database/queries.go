package database

import (
    "database/sql"
    "time"
    "reflecto.trend/models"
    "golang.org/x/crypto/bcrypt"
)

func (s *service) ExecQuery(cmd string, values ...interface{}) ([]interface{}, error) {
    var rows []interface{}
    err := s.db.QueryRow(cmd, values...).Scan(&rows)
    if err != nil {
        return nil, err
    }
    return rows, nil
}

func (s *service) UserExists(email string) (bool, error) {
    var exists bool
    err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", email).Scan(&exists)
    if err != nil {
        return false, err
    }
    return exists, nil
}

func compareHashAndPassword(hashedPwdFromDB string, plainPwd []byte) bool {
    byteHash := []byte(hashedPwdFromDB)

    err := bcrypt.CompareHashAndPassword(byteHash, plainPwd)
    if err != nil {
        return false
    }

    return true
}

func (s *service) CheckUserCreds(email string, password []byte) (int64, error) {
    var id int64
    var passwordFromDB string
    err := s.db.QueryRow("SELECT id, password FROM users WHERE email=$1 and is_social=$2", email, false).Scan(&id, &passwordFromDB)
    if err != nil {
        return -1, err
    }

    if !compareHashAndPassword(passwordFromDB, password) {
        return -1, nil
    }
    return id, nil
}

func (s *service) CreateUser(email string, password []byte) error {
    current_timestamp := time.Now()

    var newUserId int
    err := s.db.QueryRow(`INSERT INTO users (email, password, is_admin, is_verified, is_archived, created_at, updated_at, last_login, is_social)
                        VALUES ($1, $2, $3, $3, $3, $4, $4, $4, $3) RETURNING id`,
                        email, password, false, current_timestamp).Scan(&newUserId)
    if err != nil {
        return err
    }

	defaultPricingPlanID := 1
	expiration := time.Now().Add(30 * 24 * time.Hour)
	err = s.InsertUserPricing(newUserId, defaultPricingPlanID, expiration)
    if err != nil {
        return err
    }

    return nil
}

func (s *service) CreateSocialAuthUser(email string) error {
    current_timestamp := time.Now()

    var newUserId int
    err := s.db.QueryRow(`INSERT INTO users (email, created_at, updated_at, last_login, is_verified, is_social)
                        VALUES ($1, $2, $2, $2, $3, $3) RETURNING id`,
                        email, current_timestamp, true).Scan(&newUserId)
    if err != nil {
        return err
    }
    _, err = s.db.Exec("INSERT INTO social_auth (user_id, provider) VALUES ($1, $2)", newUserId, "google")
    if err != nil {
        return err
    }

    defaultPricingPlanID := 1
	expiration := time.Now().Add(30 * 24 * time.Hour)
	err = s.InsertUserPricing(newUserId, defaultPricingPlanID, expiration)
    if err != nil {
        return err
    }

    return nil
}

func (s *service) UpdateLastLogin(id int) error {
    current_timestamp := time.Now()
    _, err := s.db.Exec("UPDATE users SET last_login=$1 WHERE id=$2", current_timestamp, id)
    if err != nil {
        return err
    }
    return nil
}


func (s *service) RegisterAdmin(id int) error {
    _, err := s.db.Exec("UPDATE users SET is_admin=$1 WHERE id=$2", true, id)
    if err != nil {
        return err
    }
    return nil
}

func (s *service) GetUserDetails(email string) (models.UserView, error) {
    var user models.UserView
    err := s.db.QueryRow("SELECT id, email, is_verified, is_archived, is_admin, is_social, created_at, updated_at, last_login FROM users WHERE email=$1", email).Scan(&user.Id, &user.Email, &user.IsVerified, &user.IsArchived, &user.IsAdmin, &user.IsSocial, &user.CreatedAt, &user.UpdatedAt, &user.LastLogin)
    if err != nil {
        return models.UserView{}, err
    }
    return user, nil
}


func (s *service) InsertUserPricing(userId int, pricingPlanId int, expiration time.Time) error {
    _, err := s.db.Exec(`INSERT INTO user_pricing (user_id, pricing_plan_id, expiration) VALUES ($1, $2, $3)`,
                     userId, pricingPlanId, expiration)
    return err
}

func (s *service) GetUserPricing(userId int) (models.UserPricing, error) {
    var userPricing models.UserPricing
    err := s.db.QueryRow(`SELECT user_id, pricing_plan_id, expiration FROM user_pricing WHERE user_id=$1`, userId).
             Scan(&userPricing.UserId, &userPricing.PricingPlanId, &userPricing.Expiration)
    if err != nil {
        return models.UserPricing{}, err
    }
    return userPricing, nil
}

func (s *service) UpdateUserPricing(userId int, pricingPlanId int, expiration time.Time) error {
    _, err := s.db.Exec(`UPDATE user_pricing SET pricing_plan_id=$1, expiration=$2 WHERE user_id=$3`,
                     pricingPlanId, expiration, userId)
    return err
}

func (s *service) RetractToken(token string, expiration time.Time) error {
    _, err := s.db.Exec(`INSERT INTO blacklist_token (token, expiration) VALUES ($1, $2)`, token, expiration)
    return err
}

func (s *service) CheckTokenInBlackList(token string) (bool, error) {
    var exists bool
    err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM blacklist_token WHERE token=$1)", token).Scan(&exists)
    if err != nil {
        return false, err
    }
    return exists, nil
}

func (s *service) DeleteExpiredTokens(token string) error {
    _, err := s.db.Exec("DELETE FROM blacklist_token WHERE expiration < $1", time.Now())
    return err
}

func (s *service) UpdateEmailVerificationStatus(email string) error {
    _, err := s.db.Exec(`UPDATE users set is_verified=$1 where email=$2`,
                true, email)
    return err
}

func (s *service) CreateAlert(email, symbol, condition string, targetValue float64, windowMinutes *int, repeat int) (*models.Alert, error) {
	var a models.Alert
	err := s.db.QueryRow(
		`INSERT INTO alerts (user_email, symbol, condition, target_value, window_minutes, repeat)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, user_email, symbol, condition, target_value, window_minutes, status, repeat, created_at`,
		email, symbol, condition, targetValue, windowMinutes, repeat,
	).Scan(&a.ID, &a.UserEmail, &a.Symbol, &a.Condition, &a.TargetValue, &a.WindowMinutes, &a.Status, &a.Repeat, &a.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (s *service) ListAlertsByUser(email string) ([]models.Alert, error) {
	rows, err := s.db.Query(
		`SELECT id, user_email, symbol, condition, target_value, window_minutes, status, repeat, created_at, triggered_at
		 FROM alerts WHERE user_email = $1 ORDER BY created_at DESC`, email)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []models.Alert
	for rows.Next() {
		var a models.Alert
		var triggeredAt sql.NullTime
		if err := rows.Scan(&a.ID, &a.UserEmail, &a.Symbol, &a.Condition, &a.TargetValue, &a.WindowMinutes, &a.Status, &a.Repeat, &a.CreatedAt, &triggeredAt); err != nil {
			return nil, err
		}
		if triggeredAt.Valid {
			ct := models.CustomTime{Time: triggeredAt.Time}
			a.TriggeredAt = &ct
		}
		alerts = append(alerts, a)
	}
	return alerts, rows.Err()
}

func (s *service) UpdateAlertStatusOnly(id int, email string, status string) error {
	res, err := s.db.Exec(`UPDATE alerts SET status = $1, triggered_at = NULL WHERE id = $2 AND user_email = $3`, status, id, email)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *service) UpdateAlertTarget(id int, email string, target float64) error {
	res, err := s.db.Exec(`UPDATE alerts SET target_value = $1 WHERE id = $2 AND user_email = $3`, target, id, email)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *service) UpdateAlertRepeat(id int, email string, repeat int) error {
	res, err := s.db.Exec(`UPDATE alerts SET repeat = $1 WHERE id = $2 AND user_email = $3`, repeat, id, email)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *service) DeleteAlert(id int, email string) error {
	res, err := s.db.Exec(`DELETE FROM alerts WHERE id = $1 AND user_email = $2`, id, email)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *service) ListActiveAlerts() ([]models.Alert, error) {
	rows, err := s.db.Query(
		`SELECT id, user_email, symbol, condition, target_value, window_minutes, status, repeat, created_at, triggered_at
		 FROM alerts WHERE status = 'active' ORDER BY symbol`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []models.Alert
	for rows.Next() {
		var a models.Alert
		var triggeredAt sql.NullTime
		if err := rows.Scan(&a.ID, &a.UserEmail, &a.Symbol, &a.Condition, &a.TargetValue, &a.WindowMinutes, &a.Status, &a.Repeat, &a.CreatedAt, &triggeredAt); err != nil {
			return nil, err
		}
		if triggeredAt.Valid {
			ct := models.CustomTime{Time: triggeredAt.Time}
			a.TriggeredAt = &ct
		}
		alerts = append(alerts, a)
	}
	return alerts, rows.Err()
}

func (s *service) GetAlertByID(id int) (*models.Alert, error) {
	var a models.Alert
	var triggeredAt sql.NullTime
	err := s.db.QueryRow(
		`SELECT id, user_email, symbol, condition, target_value, window_minutes, status, repeat, created_at, triggered_at
		 FROM alerts WHERE id = $1`, id,
	).Scan(&a.ID, &a.UserEmail, &a.Symbol, &a.Condition, &a.TargetValue, &a.WindowMinutes, &a.Status, &a.Repeat, &a.CreatedAt, &triggeredAt)
	if err != nil {
		return nil, err
	}
	if triggeredAt.Valid {
		ct := models.CustomTime{Time: triggeredAt.Time}
		a.TriggeredAt = &ct
	}
	return &a, nil
}

func (s *service) UpdateAlertStatus(id int, status string) error {
	_, err := s.db.Exec(`UPDATE alerts SET status = $1, triggered_at = CURRENT_TIMESTAMP WHERE id = $2`, status, id)
	return err
}

func (s *service) ResetPassword(email string, password []byte) error {
    _, err := s.db.Exec(`UPDATE users set password=$1 where email=$2`,
                password, email)
    return err
}

