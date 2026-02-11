package users

import (
	"bytes"
	"context"
	"encoding/json"
    "errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"reflecto.trend/handler"
	"reflecto.trend/models"
	"reflecto.trend/utils"
	"strconv"
	"strings"
	"time"

	"github.com/julienschmidt/httprouter"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"github.com/stripe/stripe-go/v72"
	"github.com/stripe/stripe-go/v72/paymentmethod"
	"github.com/stripe/stripe-go/v72/token"
)

// Define missing variable
var oauthStateString = "random"

// Define missing function
func passToHash(pass string) ([]byte, error) {
	passwordBytes := []byte(pass)
	passwordEncrypted, err := bcrypt.GenerateFromPassword(passwordBytes, bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	return passwordEncrypted, nil
}

// Define missing struct
type PaymentIntentRequest struct {
	Amount                  int64  `json:"amount"`
	Currency                string `json:"currency"`
	PaymentMethodID         string `json:"payment_method_id"`
	AutomaticPaymentMethods struct {
		Enabled bool `json:"enabled"`
	} `json:"automatic_payment_methods"`
}

func GetCurrentUser(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		email := r.Context().Value("email").(string)
		userDetails, err := env.DB.GetUserDetails(email)
		if err != nil {
			http.Error(w, "Failed to retrieve user details", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(userDetails)
	}
}

func GetUserPricingHandler(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		token := r.Header.Get("Authorization")
		if token == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		email, err := DecodeAuthToken(token)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		user, err := env.DB.GetUserDetails(email)
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		if !user.IsVerified {
			http.Error(w, "User is not verified", http.StatusUnauthorized)
			return
		} else if user.IsArchived {
			http.Error(w, "User is not active", http.StatusUnauthorized)
			return
		}

		userIdStr := r.URL.Query().Get("userId")
		userId, err := strconv.Atoi(userIdStr)
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}

		pricing, err := env.DB.GetUserPricing(userId)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(pricing)
	}
}

func UpdateUserPricingHandler(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		var req models.UserPricing
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		expirationTime := req.Expiration.ToTime()

		err := env.DB.UpdateUserPricing(req.UserId, req.PricingPlanId, expirationTime)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Pricing plan updated successfully"))
	}
}

func HandleRegister(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
	defer r.Body.Close()

	body, _ := io.ReadAll(r.Body)
	r.Body = io.NopCloser(bytes.NewBuffer(body))

	var apiReq models.UserRegisterRequest
	err := json.NewDecoder(r.Body).Decode(&apiReq)
	if err != nil {
		return handler.StatusError{Code: 400, Err: errors.New("Invalid Body")}
	}

	userExists, err := env.DB.UserExists(apiReq.Email)
	if err != nil {
		return handler.StatusError{Code: 500, Err: err}
	}
	if userExists == true {
		return handler.StatusError{Code: 400, Err: errors.New("User with provided email/username already exists")}
	}

	password_encrypted, err := passToHash(apiReq.Password)
	if err != nil {
		return handler.StatusError{Code: 500, Err: err}
	}

	err = env.DB.CreateUser(apiReq.Email, password_encrypted)
	if err != nil {
		return handler.StatusError{Code: 500, Err: err}
	}

	err = utils.SendWelcomeEmail(apiReq.Email)
	if err != nil {
		return handler.StatusError{Code: 500, Err: err}
	}

	return nil
}

func HandleLogin(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
	defer r.Body.Close()

	body, _ := io.ReadAll(r.Body)
	r.Body = io.NopCloser(bytes.NewBuffer(body))

	var apiReq models.UserRegisterRequest
	err := json.NewDecoder(r.Body).Decode(&apiReq)
	if err != nil {
		return handler.StatusError{Code: 400, Err: errors.New("Invalid Body")}
	}

	userId, err := env.DB.CheckUserCreds(apiReq.Email, []byte(apiReq.Password))
	if err != nil || userId == -1 {
		log.Println(err)
		return handler.StatusError{Code: 401, Err: errors.New("Unauthorized")}
	}

	user, err := env.DB.GetUserDetails(apiReq.Email)
	if err != nil {
		return handler.StatusError{Code: 500, Err: err}
	} else if !user.IsVerified {
		return handler.StatusError{Code: 401, Err: errors.New("User not verified")}
	} else if user.IsArchived {
		return handler.StatusError{Code: 401, Err: errors.New("User archived, please contact support")}
	}

	authToken, refreshToken, err := CreateTokens(apiReq.Email)
	if err != nil {
		return handler.StatusError{Code: 401, Err: err}
	}

    err = env.DB.UpdateLastLogin(user.Id)
    if err != nil  {
		return handler.StatusError{Code: 401, Err: err}
    }

	w.WriteHeader(http.StatusOK)
	w.Header().Add("Content-Type", "application/json")

	resp := models.UserLoginResponse{
		AccessToken:  authToken,
		RefreshToken: refreshToken,
	}
	err = json.NewEncoder(w).Encode(resp)
	if err != nil {
		return handler.StatusError{Code: 401, Err: err}
	}

	return nil
}

func HandleLogout(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
	var apiReq models.UserLogoutRequest
	err := json.NewDecoder(r.Body).Decode(&apiReq)
	if err != nil {
		return handler.StatusError{Code: 400, Err: errors.New("Invalid Body")}
	}

	accessExpTime, err := getTokenExpirationTime(apiReq.AccessToken)
	if err != nil {
		return handler.StatusError{Code: 400, Err: err}
	}

	err = env.DB.RetractToken(apiReq.AccessToken, accessExpTime)
	if err != nil {
		return handler.StatusError{Code: 400, Err: err}
	}

	refreshExpTime, err := getTokenExpirationTime(apiReq.RefreshToken)
	if err != nil {
		return handler.StatusError{Code: 400, Err: err}
	}

	err = env.DB.RetractToken(apiReq.RefreshToken, refreshExpTime)
	if err != nil {
		return handler.StatusError{Code: 400, Err: err}
	}

	w.WriteHeader(http.StatusOK)
	return nil
}

func ResendVerificationEmail(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    email := r.URL.Query().Get("email")
    userExists, err := env.DB.UserExists(email)
    if (err != nil || !userExists) {
        return handler.StatusError{Code: 400, Err: fmt.Errorf("User %q does not exist", email)}
    }

	err = utils.SendWelcomeEmail(email)
	if err != nil {
		return handler.StatusError{Code: 500, Err: err}
	}

    w.WriteHeader(http.StatusOK)
	return nil
}

func ConfirmEmail(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    token := r.URL.Query().Get("token")

    if len(token) == 0 {
        return handler.StatusError{Code: 400, Err: errors.New("Invalid Token")}
    }

    var verificationToken *models.EmailVerificationToken
    jsonBytes := utils.Decrypt(token)

    err := json.Unmarshal(jsonBytes, &verificationToken)
    if err != nil {
        fmt.Println(err)
        return handler.StatusError{Code: 400, Err: errors.New("Invalid Token")}
    }

    if verificationToken.Expiration.Before(time.Now().UTC()) {
        return handler.StatusError{Code: 400, Err: errors.New("Verification link expired!")}
    }

    userExists, err := env.DB.UserExists(verificationToken.Email)
    if (err != nil || !userExists) {
        return handler.StatusError{Code: 400, Err: errors.New("User does not exists")}
    }

    err = env.DB.UpdateEmailVerificationStatus(verificationToken.Email)
    if err != nil {
        fmt.Println(err)
        return handler.StatusError{Code: 500, Err: errors.New("Not able to update user")}
    }

    redirect_url := os.Getenv("site_url") + "/verifyEmail"

    http.Redirect(w, r, redirect_url, 302)
    w.WriteHeader(http.StatusTemporaryRedirect)

	return nil
}

func SendForgotPasswordEmail(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    email := r.URL.Query().Get("email")
    userExists, err := env.DB.UserExists(email)
    if (err != nil || !userExists) {
        return handler.StatusError{Code: 400, Err: fmt.Errorf("User %q does not exist", email)}
    }

	err = utils.SendForgotPasswordEmail(email)
	if err != nil {
		return handler.StatusError{Code: 500, Err: err}
	}

    w.WriteHeader(http.StatusOK)

	w.Write([]byte("Password reset email sent successfully"))
    w.WriteHeader(http.StatusOK)
	return nil
}

func ResetPassword(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    var apiReq models.ResetPasswordRequest
    err := json.NewDecoder(r.Body).Decode(&apiReq)
    if err != nil {
        return handler.StatusError{Code: 400, Err: errors.New("Invalid Body")}
    }

    if len(apiReq.Token) == 0 {
        return handler.StatusError{Code: 400, Err: errors.New("Invalid Token")}
    }

    var verificationToken *models.EmailVerificationToken
    jsonBytes := utils.Decrypt(apiReq.Token)

    err = json.Unmarshal(jsonBytes, &verificationToken)
    if err != nil {
        fmt.Println(err)
        return handler.StatusError{Code: 400, Err: errors.New("Invalid Token")}
    }

    if verificationToken.Expiration.Before(time.Now().UTC()) {
        return handler.StatusError{Code: 400, Err: errors.New("Verification link expired!")}
    }

    userExists, err := env.DB.UserExists(verificationToken.Email)
    if (err != nil || !userExists) {
        return handler.StatusError{Code: 400, Err: errors.New("User does not exist")}
    }

    passEnc, err := passToHash(apiReq.Password)
    if err != nil {
        fmt.Println(err)
        return handler.StatusError{Code: 500, Err: errors.New("Internal Server Error")}
    }

    err = env.DB.ResetPassword(verificationToken.Email, passEnc)
    if err != nil {
        fmt.Println(err)
        return handler.StatusError{Code: 500, Err: errors.New("Internal Server Error")}
    }

	w.WriteHeader(http.StatusOK)
	return nil
}

// to be wrapped around "validate token"
func ChangePassword(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
	w.WriteHeader(http.StatusOK)
	return nil
}

func InitGoogleAuth(env *handler.Env, authConf *handler.OauthConf) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		var url = authConf.OauthConf.AuthCodeURL(oauthStateString, oauth2.AccessTypeOffline)
		w.Header().Add("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"url": url})
	}
}

func GoogleAuthCallBack(env *handler.Env, authConf *handler.OauthConf) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		state := r.FormValue("state")
		if state != oauthStateString {
			http.Error(w, "Invalid state", http.StatusBadRequest)
			return
		}

		code := string(r.FormValue("code"))

		url := "https://oauth2.googleapis.com/token" + "?code=" + code +
			"&client_id=" + authConf.OauthConf.ClientID +
			"&client_secret=" + authConf.OauthConf.ClientSecret +
			"&redirect_uri=" + authConf.OauthConf.RedirectURL +
			"&grant_type=authorization_code"

		req, err := http.NewRequest("POST", url, nil)
		if err != nil {
			http.Error(w, "Server Error", http.StatusInternalServerError)
			return
		}
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			http.Error(w, "Server Error", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Server Error", http.StatusInternalServerError)
			return
		}

		var result = make(map[string]interface{})
		err = json.Unmarshal(body, &result)
		if err != nil {
			http.Error(w, "Server Error", http.StatusInternalServerError)
			return
		}
		accessToken, ok := result["access_token"].(string)
		if !ok {
			http.Error(w, "Invalid token", http.StatusInternalServerError)
			return
		}

		req, err = http.NewRequest("POST", "https://openidconnect.googleapis.com/v1/userinfo", nil)
		if err != nil {
			http.Error(w, "Server Error", http.StatusInternalServerError)
			return
		}
		req.Header.Set("Authorization", "Bearer "+accessToken)
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

		resp, err = client.Do(req)
		if err != nil {
			http.Error(w, "Server Error", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()
		body, err = io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Server Error", http.StatusInternalServerError)
			return
		}

		result = make(map[string]interface{})
		err = json.Unmarshal(body, &result)
		if err != nil {
			http.Error(w, "Server Error", http.StatusInternalServerError)
			return
		}
		email, ok := result["email"].(string)
		if !ok {
			http.Error(w, "Invalid email", http.StatusInternalServerError)
			return
		}

		exists, err := env.DB.UserExists(email)
		if err != nil {
			http.Error(w, "Server Error", http.StatusInternalServerError)
			return
		}

		if !exists {
			err = env.DB.CreateSocialAuthUser(email)
			if err != nil {
				http.Error(w, "Server Error", http.StatusInternalServerError)
				return
			}
			w.WriteHeader(http.StatusCreated)
		} else {
			w.WriteHeader(http.StatusOK)
		}

		authToken, refreshToken, err := CreateTokens(email)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		w.Header().Add("Content-Type", "application/json")

		io.WriteString(w, `{"auth":"`+authToken+`",`)
		io.WriteString(w, `"refresh":"`+refreshToken+`"}`)
	}
}
func HandleAuthorization(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		token := r.Header.Get("Authorization")
		email, err := DecodeAuthToken(token)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		w.Header().Add("Content-Type", "application/json")
		io.WriteString(w, `{"email":"`+email+`"}`)
	}
}

func HandleGetUser(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		token := r.Header.Get("Authorization")
		if token == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		email, err := DecodeAuthToken(token)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		user, err := env.DB.GetUserDetails(email)
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		if !user.IsVerified {
			http.Error(w, "User not verified", http.StatusUnauthorized)
			return
		} else if user.IsArchived {
			http.Error(w, "User archived, please contact support", http.StatusUnauthorized)
			return
		}

		log.Println(user)

		w.Header().Add("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(user)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
	}
}

func HandleRefresh(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    var apiReq models.RefreshTokenRequest
    err := json.NewDecoder(r.Body).Decode(&apiReq)
    if err != nil {
		return handler.StatusError{Code: 400, Err: errors.New("Invalid Body")}
    }
    refreshToken := apiReq.RefreshToken
    print(refreshToken)

    email, err := DecodeRefreshToken(refreshToken)
    if err != nil {
		return handler.StatusError{Code: 401, Err: errors.New("Error Decoding Token")}
    }

    exists, err := env.DB.UserExists(email)
    if err != nil || !exists {
		return handler.StatusError{Code: 401, Err: errors.New("Unauthorized")}
    }
    authToken, refreshToken, err := CreateTokens(email)
    if err != nil {
		return handler.StatusError{Code: 401, Err: errors.New("Unauthorized")}
    }

    w.WriteHeader(http.StatusOK)
    w.Header().Add("Content-Type", "application/json")
    resp := models.UserLoginResponse{
        AccessToken:  authToken,
        RefreshToken: refreshToken,
    }
    if err := json.NewEncoder(w).Encode(resp); err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
    }
    return nil
}

type RecaptchaResponse struct {
	Success     bool     `json:"success"`
	ChallengeTs string   `json:"challenge_ts"`
	Hostname    string   `json:"hostname"`
	ErrorCodes  []string `json:"error-codes"`
}

type RecaptchaRequest struct {
	CaptchaValue string `json:"captcha_value"`
}

func ConfirmCaptcha(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
	var reqBody RecaptchaRequest
	err := json.NewDecoder(r.Body).Decode(&reqBody)
	if err != nil {
		return handler.StatusError{Code: 400, Err: errors.New("Invalid Body")}
	}

	url := "https://www.google.com/recaptcha/api/siteverify"
	secretKey := os.Getenv("site_secret_key")
	data := map[string]string{
		"secret":   secretKey,
		"response": reqBody.CaptchaValue,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return handler.StatusError{Code: 500, Err: err}
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return handler.StatusError{Code: 500, Err: err}
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return handler.StatusError{Code: 500, Err: err}
	}

	var recaptchaResponse RecaptchaResponse
	err = json.Unmarshal(body, &recaptchaResponse)
	if err != nil {
		return handler.StatusError{Code: 500, Err: err}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	json.NewEncoder(w).Encode(recaptchaResponse)
	return nil
}

type PaymentMethodRequest struct {
	Number   string `json:"number"`
	ExpMonth int64  `json:"exp_month"`
	ExpYear  int64  `json:"exp_year"`
	CVC      string `json:"cvc"`
}

func HandleCreatePaymentMethod(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		fmt.Println("Handler started")
		var req PaymentMethodRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			fmt.Println("Error decoding request:", err)
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		stripe.Key = "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"

		// Convert int64 to string
		expMonthStr := strconv.FormatInt(req.ExpMonth, 10)
		expYearStr := strconv.FormatInt(req.ExpYear, 10)

		// Create a Card Token first
		tokenParams := &stripe.TokenParams{
			Card: &stripe.CardParams{
				Number:   stripe.String(req.Number),
				ExpMonth: stripe.String(expMonthStr),
				ExpYear:  stripe.String(expYearStr),
				CVC:      stripe.String(req.CVC),
			},
		}

		fmt.Println("Creating token with params:", tokenParams)

		tk, err := token.New(tokenParams)
		if err != nil {
			fmt.Println("Failed to create token:", err)
			http.Error(w, "Failed to create token", http.StatusInternalServerError)
			return
		}

		if tk.ID == "" {
			fmt.Println("Token ID is empty")
			http.Error(w, "Token creation failed, ID is empty", http.StatusInternalServerError)
			return
		}

		fmt.Println("Token created successfully:", tk.ID)

		// Create a PaymentMethod using the token
		pmParams := &stripe.PaymentMethodParams{
			Type: stripe.String("card"),
			Card: &stripe.PaymentMethodCardParams{
				Token: stripe.String(tk.ID), // Ensure this is the token ID from the created token
			},
		}

		fmt.Println("Creating payment method with params:", pmParams)

		pm, err := paymentmethod.New(pmParams)
		if err != nil {
			fmt.Println("Failed to create payment method:", err)
			http.Error(w, "Failed to create payment method", http.StatusInternalServerError)
			return
		}

		fmt.Println("Payment method created successfully:", pm.ID)

		response := map[string]string{"paymentMethodID": pm.ID}
		if err := json.NewEncoder(w).Encode(response); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

func HandleCreatePaymentIntent(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		// Decode the incoming request body
		var req PaymentIntentRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("Error decoding request: %v", err)
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		// Set the API Key
		apiKey := "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"

		// Prepare the data payload
		data := url.Values{}
		data.Set("amount", fmt.Sprintf("%d", req.Amount*100)) // Convert to cents
		data.Set("currency", req.Currency)
		if req.PaymentMethodID != "" {
			data.Set("payment_method", req.PaymentMethodID) // Set the payment method ID if provided
		}
		if req.AutomaticPaymentMethods.Enabled {
			data.Add("payment_method_types[]", "card")
			data.Add("setup_future_usage", "off_session")
		}

		// Create new request
		clientRequest, err := http.NewRequest("POST", "https://api.stripe.com/v1/payment_intents", strings.NewReader(data.Encode()))
		if err != nil {
			log.Printf("Failed to create request: %v", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		// Set headers
		clientRequest.Header.Add("Authorization", "Bearer "+apiKey)
		clientRequest.Header.Add("Content-Type", "application/x-www-form-urlencoded")

		// HTTP client
		client := &http.Client{}

		// Perform the request
		response, err := client.Do(clientRequest)
		if err != nil {
			log.Printf("Failed to send request: %v", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		defer response.Body.Close()

		// Read the response body
		responseBody, err := io.ReadAll(response.Body)
		if err != nil {
			log.Printf("Failed to read response body: %v", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		log.Printf("Stripe Response: %s", responseBody)

		if response.StatusCode != http.StatusOK {
			log.Printf("Non-200 response from Stripe: %s", responseBody)
			http.Error(w, "Error from Stripe", response.StatusCode)
			return
		}

		// Process the response
		var respData map[string]interface{}
		if err := json.Unmarshal(responseBody, &respData); err != nil {
			log.Printf("Error parsing response from Stripe: %v", err)
			http.Error(w, "Error parsing Stripe response", http.StatusInternalServerError)
			return
		}

		clientSecret, ok := respData["client_secret"].(string)
		if !ok {
			log.Printf("Stripe response parsing error: client_secret not found")
			http.Error(w, "Invalid response from Stripe", http.StatusInternalServerError)
			return
		}

		// Send the client secret to the client
		json.NewEncoder(w).Encode(map[string]string{"clientSecret": clientSecret})
	}
}

func ValidateToken(env *handler.Env, next httprouter.Handle) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		token := r.Header.Get("Authorization")
		email, err := DecodeAuthToken(token)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		user, err := env.DB.GetUserDetails(email)
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		if !user.IsVerified {
			http.Error(w, "User is not verified", http.StatusUnauthorized)
			return
		} else if user.IsArchived {
			http.Error(w, "User is not active", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "email", email)
		r = r.WithContext(ctx)

		next(w, r, ps)
	}
}
