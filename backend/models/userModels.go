package models

import (
	"database/sql/driver"
	"time"
)

func (ct CustomTime) ToTime() time.Time {
	return ct.Time
}

type PaymentIntentRequest struct {
	Amount                  int64
	Currency                string
	AutomaticPaymentMethods struct {
		Enabled bool
	}
}

type CustomTime struct {
	time.Time
}

func (ct *CustomTime) MarshalJSON() ([]byte, error) {
	return []byte(ct.Time.Format(`"2006-01-02T15:04:05Z"`)), nil
}

func (ct *CustomTime) Value() (driver.Value, error) {
	return ct.Time, nil
}

func (ct *CustomTime) Scan(value interface{}) error {
	ct.Time = value.(time.Time)
	return nil
}

type User struct {
	Id         int        `json:"id"`
	Email      string     `json:"email"`
	CreatedAt  CustomTime `json:"created_at"`
	UpdatedAt  CustomTime `json:"updated_at"`
	LastLogin  CustomTime `json:"last_login"`
	IsVerified bool       `json:"is_verified"`
	IsArchived bool       `json:"is_archived"`
	IsAdmin    bool       `json:"is_admin"`
	IsSocial   bool       `json:"is_social"`
}

type UserView struct {
	Id         int    `json:"id"`
	Email      string `json:"email"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
	LastLogin  string `json:"last_login"`
	IsVerified bool   `json:"is_verified"`
	IsArchived bool   `json:"is_archived"`
	IsAdmin    bool   `json:"is_admin"`
	IsSocial   bool   `json:"is_social"`
}

type UserPricing struct {
	UserId        int        `json:"user_id"`
	PricingPlanId int        `json:"pricing_plan_id"`
	Expiration    CustomTime `json:"expiration"`
}

type Pricing struct {
	Id    int `json:"id"`
	Price int `json:"price"`
}

type UserRegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UserRegisterResponse struct {
	Email     string     `json:"email"`
	CreatedAt CustomTime `json:"created_at"`
}

type UserDataResponse struct {
	Id         int        `json:"id"`
	Email      string     `json:"email"`
	IsAdmin    bool       `json:"is_admin"`
	IsSocial   bool       `json:"is_social"`
	IsVerified bool       `json:"is_verified"`
	IsArchived bool       `json:"is_archived"`
	CreatedAt  CustomTime `json:"created_at"`
	UpdatedAt  CustomTime `json:"updated_at"`
	LastLogin  CustomTime `json:"last_login"`
}

type UserLoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type ResetPasswordRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type UserLogoutRequest struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type BlackListedToken struct {
	RefreshToken string     `json:"refresh_token"`
	Expiration   CustomTime `json:"expiration"`
}

type EmailVerificationToken struct {
    Email  string `json:email`
    Expiration  time.Time `json:expiration`
}

type IntBool int

func (b IntBool) MarshalJSON() ([]byte, error) {
	if b != 0 {
		return []byte(`true`), nil
	}
	return []byte(`false`), nil
}

func (b *IntBool) UnmarshalJSON(data []byte) error {
	if string(data) == `true` || string(data) == `1` {
		*b = 1
	} else {
		*b = 0
	}
	return nil
}

type Alert struct {
	ID            int         `json:"id"`
	UserEmail     string      `json:"user_email"`
	Symbol        string      `json:"symbol"`
	Condition     string      `json:"condition"`
	TargetValue   float64     `json:"target_value"`
	WindowMinutes *int        `json:"window_minutes,omitempty"`
	Status        string      `json:"status"`
	Repeat        IntBool     `json:"repeat"`
	CreatedAt     CustomTime  `json:"created_at"`
	TriggeredAt   *CustomTime `json:"triggered_at,omitempty"`
}

type CreateAlertRequest struct {
	Symbol        string  `json:"symbol"`
	Condition     string  `json:"condition"`
	TargetValue   float64 `json:"target_value"`
	WindowMinutes *int    `json:"window_minutes,omitempty"`
	Repeat        bool    `json:"repeat"`
}

type UpdateAlertRequest struct {
	TargetValue *float64 `json:"target_value,omitempty"`
	Status      *string  `json:"status,omitempty"`
	Repeat      *bool    `json:"repeat,omitempty"`
}

type EmailData struct {
	UnsubscribeLink   string
	ProductUrl        string
	ResetPasswordLink string
	ContactUsUrl      string
	VerifyLink        string
	AlertSymbol       string
	AlertCondition    string
	AlertTarget       string
	AlertCurrentPrice string
	AlertTime         string
}

