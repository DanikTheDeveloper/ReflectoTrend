package models

import (
    "time"
    "database/sql/driver"
)

// UserStatus is a custom type to represent the user's status.
type UserStatus string

const (
    StatusDisabled   UserStatus = "disabled"
    StatusArchive    UserStatus = "archive"
    StatusUnverified UserStatus = "unverified"
    StatusActive     UserStatus = "active"
)

func (ct CustomTime) ToTime() time.Time {
    return ct.Time
}

type PaymentIntentRequest struct {
    Amount                   int64
    Currency                 string
    AutomaticPaymentMethods struct {
        Enabled bool
    }
}

// CustomTime to handle JSON time formatting.
type CustomTime struct {
    time.Time
}

// MarshalJSON will format the time as JSON.
func (ct *CustomTime) MarshalJSON() ([]byte, error) {
    return []byte(ct.Time.Format(`"2006-01-02T15:04:05Z"`)), nil
}

// Value makes the CustomTime struct implement the driver.Valuer interface. This method
// simply returns the time represented as a UNIX timestamp.
func (ct *CustomTime) Value() (driver.Value, error) {
    return ct.Time, nil
}

// Scan implements the sql.Scanner interface for database deserialization.
func (ct *CustomTime) Scan(value interface{}) error {
    ct.Time = value.(time.Time)
    return nil
}

// User represents a user in the system.
type User struct {
    Id                   int          `json:"id"`
    Email                string       `json:"email"`
    CreatedAt            CustomTime   `json:"created_at"`
    UpdatedAt            CustomTime   `json:"updated_at"`
    LastLogin            CustomTime   `json:"last_login"`
    Status               UserStatus   `json:"status"`
    IsAdmin              bool         `json:"is_admin"`
    IsSocial             bool         `json:"is_social"`
}

// UserView represents how user data is sent to the client.
type UserView struct {
    Id                   int          `json:"id"`
    Email                string       `json:"email"`
    CreatedAt            string       `json:"created_at"`
    UpdatedAt            string       `json:"updated_at"`
    LastLogin            string       `json:"last_login"`
    Status               UserStatus   `json:"status"`
    IsAdmin              bool         `json:"is_admin"`
    IsSocial             bool         `json:"is_social"`
}

// UserPricing represents a user's pricing plan.
type UserPricing struct {
    UserId        int        `json:"user_id"`
    PricingPlanId int        `json:"pricing_plan_id"`
    Expiration    CustomTime `json:"expiration"`
}

// Pricing represents the pricing plan details.
type Pricing struct {
    Id    int `json:"id"`
    Price int `json:"price"`
}

// UserRegisterRequest represents a registration request.
type UserRegisterRequest struct {
    Email    string `json:"email"`
    Password string `json:"password"`
}

// UserRegisterResponse represents a registration response.
type UserRegisterResponse struct {
    Email      string     `json:"email"`
    CreatedAt  CustomTime `json:"created_at"`
}


// UserDataResponse represents the data returned to the client upon successful data request.
type UserDataResponse struct {
    Id         int        `json:"id"`
    Email      string     `json:"email"`
    Status     UserStatus `json:"status"`
    IsAdmin    bool       `json:"is_admin"`
    IsSocial   bool       `json:"is_social"`
    CreatedAt  CustomTime `json:"created_at"`
    UpdatedAt  CustomTime `json:"updated_at"`
    LastLogin  CustomTime `json:"last_login"`
}

// UserLoginResponse represents the response sent back upon a successful login.
type UserLoginResponse struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
}

// RefreshTokenRequest represents a request to refresh the access token.
type RefreshTokenRequest struct {
    RefreshToken string `json:"refresh_token"`
}

// UserLogoutRequest represents a logout request.
type UserLogoutRequest struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
}

type BlackListedToken struct {
    RefreshToken string `json:"refresh_token"`
    Expiration   CustomTime `json:"expiration"`
}
