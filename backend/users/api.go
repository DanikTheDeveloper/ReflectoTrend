// apis for authorization and login.

package users

import (
    "github.com/stripe/stripe-go/v72"
    "github.com/stripe/stripe-go/v72/paymentmethod"
    "fmt"
    "net/smtp"
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"

	"golang.org/x/crypto/bcrypt"
	"reflecto.trend/handler"
	"reflecto.trend/models"
    "reflecto.trend/utils"
    
    "net/url"
    "strings"
    
    "io/ioutil"

    //"context"
    "golang.org/x/oauth2"

	"strconv"
)

type PaymentIntentRequest struct {
    Amount                   int64  `json:"amount"`
    Currency                 string `json:"currency"`
    PaymentMethodID          string `json:"payment_method_id"` 
    AutomaticPaymentMethods struct {
        Enabled bool `json:"enabled"`
    } `json:"automatic_payment_methods"`
}

var passwordCost int = 10
var oauthStateString = "random"

// Example SMTP settings (you should replace these with your actual settings)
var smtpServer = "smtp.example.com"
var smtpPort = "587"
var smtpUser = "your-email@example.com"
var smtpPassword = "your-email-password"

// use try catch block around when passing user's input
// I had several instances where an invalid and incomplete token made the go panic.

func GetCurrentUser(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
	userID, ok := r.Context().Value("userID").(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return errors.New("unauthorized") // Return an error here
	}

	userIDStr := strconv.FormatInt(userID, 10) // Assuming conversion is necessary as discussed

	userDetails, err := env.DB.GetUserDetails(userIDStr)
	if err != nil {
		http.Error(w, "Failed to retrieve user details", http.StatusInternalServerError)
		return err // Return the error encountered
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userDetails)
	return nil // Return nil if no error occurred
}


func GetIndex(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    print("in index")
    err := env.DB.Ping()
    if err != nil {
        return handler.StatusError{Code: 500, Err: err}
    }
    return nil
}

func passToHash(pass string) ([]byte, error) {
    passwordBytes := []byte(pass)
    password_encrypted, err := bcrypt.GenerateFromPassword(passwordBytes, passwordCost)
    if err != nil {
        return nil, err
    }
    return password_encrypted, nil
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

    authToken, refreshToken, err := CreateTokens(apiReq.Email)
    if err != nil {
        return handler.StatusError{Code: 401, Err: err}
    }

    w.WriteHeader(http.StatusOK)
    w.Header().Add("Content-Type", "application/json")

    resp := models.UserLoginResponse{
        AccessToken: authToken,
        RefreshToken: refreshToken,
    }
    err = json.NewEncoder(w).Encode(resp)
    if err != nil {
        return handler.StatusError{Code: 401, Err: err}
    }

    return nil
}

func HandleLogout(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    // TO DO:
    // get the token and add it to the blacklist
    // return 200
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


func resendConfirmEmail(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    // TO DO:
    // we will create a token and mail it to the user
    // recreate a new token and send it to the user
    return nil
}

func ConfirmEmail(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    // recieve the token and match it from the db, if it exists, then confirm the email
    w.WriteHeader(http.StatusOK)
    return nil
}

// SendForgotPasswordEmail sends an email with a link to reset the password
func SendForgotPasswordEmail(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    // Assume we extract the user's email from the request
    userEmailAddress := r.FormValue("email")

    // Step 1: Generate a token
    token, err := utils.GenerateToken()
    if err != nil {
        http.Error(w, "Error generating token", http.StatusInternalServerError)
        return err
    }

    // Step 3: Create the password reset link
    resetLink := fmt.Sprintf("https://yourdomain.com/reset-password?token=%s", token)

    // Step 4: Send the email
    to := []string{userEmailAddress}
    msg := []byte("To: " + userEmailAddress + "\r\n" +
        "Subject: Password Reset Request\r\n" +
        "\r\n" +
        "You have requested to reset your password. Please click the following link to proceed:\r\n" +
        resetLink + "\r\n" +
        "If you did not request a password reset, please ignore this email.\r\n")

    // Setup authentication information.
    auth := smtp.PlainAuth("", smtpUser, smtpPassword, smtpServer)
    err = smtp.SendMail(smtpServer+":"+smtpPort, auth, smtpUser, to, msg)
    if err != nil {
        http.Error(w, "Failed to send email", http.StatusInternalServerError)
        return err
    }

    w.WriteHeader(http.StatusOK)
    w.Write([]byte("Password reset email sent successfully"))
    return nil
}

func ResetPassword(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    // get the token from the user, confirm with db and reset the password
    w.WriteHeader(http.StatusOK)
    return nil
}

func ChangePassword(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    // get the access token, get user and change password
    // get the previous password and the new password
    w.WriteHeader(http.StatusOK)
    return nil
}

func InitGoogleAuth(env *handler.Env, authConf *handler.OauthConf, w http.ResponseWriter, r *http.Request) error {
    var url = authConf.OauthConf.AuthCodeURL(oauthStateString, oauth2.AccessTypeOffline)
    w.Header().Add("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"url": url})
    return nil
}

func GoogleAuthCallBack(env *handler.Env, authConf *handler.OauthConf, w http.ResponseWriter, r *http.Request) error {
    state := r.FormValue("state")
    if state != oauthStateString {
        return handler.StatusError{Code: 400, Err: errors.New("Invalid state")}
    }

    code := string(r.FormValue("code"))

    url := "https://oauth2.googleapis.com/token" + "?code=" + code +
    "&client_id=" + authConf.OauthConf.ClientID +
    "&client_secret=" + authConf.OauthConf.ClientSecret +
    "&redirect_uri=" + authConf.OauthConf.RedirectURL +
    "&grant_type=authorization_code"

    req, err := http.NewRequest("POST", url, nil)
    if err != nil {
        return handler.StatusError{Code: 500, Err: err}
    }
    req.Header.Set("Content-Type", "x-www-form-urlencoded")
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return handler.StatusError{Code: 500, Err: err}
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return handler.StatusError{Code: 500, Err: err}
    }

    var result = make(map[string]interface{})
    err = json.Unmarshal(body, &result)
    if err != nil {
        return handler.StatusError{Code: 500, Err: err}
    }
    access_token, ok := result["access_token"].(string)
    if !ok {
        return handler.StatusError{Code: 500, Err: errors.New("Invalid token")}
    }

    req, err = http.NewRequest("POST", "https://openidconnect.googleapis.com/v1/userinfo", nil)
    if err != nil {
        return handler.StatusError{Code: 500, Err: err}
    }
    req.Header.Set("Authorization", "Bearer " + access_token)
    req.Header.Set("Content-Type", "x-www-form-urlencoded")

    resp, err = client.Do(req)
    if err != nil {
        return handler.StatusError{Code: 500, Err: err}
    }
    defer resp.Body.Close()
    body, err = io.ReadAll(resp.Body)
    if err != nil {
        return handler.StatusError{Code: 500, Err: err}
    }

    result = make(map[string]interface{})
    err = json.Unmarshal(body, &result)
    if err != nil {
        return handler.StatusError{Code: 500, Err: err}
    }
    email, ok := result["email"].(string)
    if !ok {
        return handler.StatusError{Code: 500, Err: errors.New("Invalid email")}
    }

    print(email)

    exists, err := env.DB.UserExists(email)
    if err != nil {
        return handler.StatusError{Code: 500, Err: err}
    }
    print("user already exists, ", exists)

    if !exists {
        err = env.DB.CreateSocialAuthUser(email)
        if err != nil {
            return handler.StatusError{Code: 500, Err: err}
        }
        w.WriteHeader(http.StatusCreated)
    } else {
        w.WriteHeader(http.StatusOK)
    }

    authToken, refreshToken, err := CreateTokens(email)
    if err != nil {
        return handler.StatusError{Code: 401, Err: err}
    }
    w.Header().Add("Content-Type", "application/json")

    io.WriteString(w, `{"auth":"` + authToken + `",`)
    io.WriteString(w, `"refresh":"` + refreshToken + `"}`)
    return nil
}

func HandleAuthorization(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    token := r.Header.Get("Authorization")
    email, err := DecodeAuthToken(token)
    if err != nil {
        return handler.StatusError{Code: 401, Err: err}
    }
    //Check if the user exists
    w.Header().Add("Content-Type", "application/json")
    io.WriteString(w, `{"email":"` + email + `"}`)
    return nil
}

func HandleGetUser(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    if r.Header.Get("Authorization") == "" {
        return handler.StatusError{Code: 401, Err: errors.New("Unauthorized")}
    }
    email, err := DecodeAuthToken(r.Header.Get("Authorization"))
    if err != nil {
        return handler.StatusError{Code: 401, Err: err}
    }

    user, err := env.DB.GetUserDetails(email)
    if err != nil {
        return handler.StatusError{Code: 500, Err: err}
    }

    log.Println(user)

    w.Header().Add("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(user)
    if err != nil {
        return handler.StatusError{Code: 401, Err: err}
    }
    return nil
}

func HandleRefresh(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    // read request body
    var apiReq models.RefreshTokenRequest
    err := json.NewDecoder(r.Body).Decode(&apiReq)
    if err != nil {
        return handler.StatusError{Code: 400, Err: errors.New("Invalid Body")}
    }
    refreshToken := apiReq.RefreshToken
    print(refreshToken)

    email, err := DecodeRefreshToken(refreshToken)
    if err != nil {
        return handler.StatusError{Code: 401, Err: errors.New("Error decoding token")}
    }

    exists, err := env.DB.UserExists(email)
    if (err != nil || !exists) {
        return handler.StatusError{Code: 401, Err: errors.New("User does not exist")}
    }
    authToken, refreshToken, err := CreateTokens(email)
    if err != nil {
        return handler.StatusError{Code: 401, Err: errors.New("Error creating tokens")}
    }

    w.WriteHeader(http.StatusOK)
    w.Header().Add("Content-Type", "application/json")
    resp := models.UserLoginResponse{
        AccessToken: authToken,
        RefreshToken: refreshToken,
    }
    err = json.NewEncoder(w).Encode(resp)
    if err != nil {
        return handler.StatusError{Code: 401, Err: err}
    }
    return nil
}

type RecaptchaResponse struct {
    Success      bool     `json:"success"`
    ChallengeTs  string   `json:"challenge_ts"`
    Hostname     string   `json:"hostname"`
    ErrorCodes   []string `json:"error-codes"`
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
    Token string `json:"token"`
}

func HandleCreatePaymentMethod(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    fmt.Println("Handler started")
    var req PaymentMethodRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        fmt.Println("Error decoding request:", err)
        http.Error(w, "Bad request", http.StatusBadRequest)
        return err
    }

    stripe.Key = "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"

    // Create a PaymentMethod using the token
    pmParams := &stripe.PaymentMethodParams{
        Type: stripe.String("card"),
        Card: &stripe.PaymentMethodCardParams{
            Token: stripe.String(req.Token),  // Ensure this is the token ID from the created token
        },
    }

    fmt.Println("Creating payment method with params:", pmParams)

    pm, err := paymentmethod.New(pmParams)
    if err != nil {
        fmt.Println("Failed to create payment method:", err)
        http.Error(w, "Failed to create payment method", http.StatusInternalServerError)
        return err
    }

    fmt.Println("Payment method created successfully:", pm.ID)

    response := map[string]string{"paymentMethodID": pm.ID}
    if err := json.NewEncoder(w).Encode(response); err != nil {
        return err
    }

    return nil
}

func HandleCreatePaymentIntent(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    // Decode the incoming request body
    var req PaymentIntentRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        log.Printf("Error decoding request: %v", err)
        http.Error(w, "Bad request", http.StatusBadRequest)
        return err
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
        return err
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
        http.Error(w, "Internal Server Error", 500)
        return err
    }
    defer response.Body.Close()

    // Read the response body
    responseBody, err := ioutil.ReadAll(response.Body)
    if err != nil {
        log.Printf("Failed to read response body: %v", err)
        http.Error(w, "Internal Server Error", 500)
        return err
    }

    log.Printf("Stripe Response: %s", responseBody) // Log response for debugging

    // Check for non-200 status code
    if response.StatusCode != http.StatusOK {
        log.Printf("Non-200 response from Stripe: %s", responseBody)
        http.Error(w, "Error from Stripe", response.StatusCode)
        return fmt.Errorf("Stripe API returned %d: %s", response.StatusCode, responseBody)
    }

    // Process the response
    var respData map[string]interface{}
    if err := json.Unmarshal(responseBody, &respData); err != nil {
        log.Printf("Error parsing response from Stripe: %v", err)
        http.Error(w, "Error parsing Stripe response", 500)
        return err
    }

    clientSecret, ok := respData["client_secret"].(string)
    if !ok {
        log.Printf("Stripe response parsing error: client_secret not found")
        http.Error(w, "Invalid response from Stripe", 500)
        return fmt.Errorf("client_secret not found in Stripe response")
    }

    // Send the client secret to the client
    json.NewEncoder(w).Encode(map[string]string{"clientSecret": clientSecret})

    return nil
}

func GetUserPricingHandler(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    userIdStr := r.URL.Query().Get("userId")
    userId, err := strconv.Atoi(userIdStr)
    if err != nil {
        http.Error(w, "Invalid user ID", http.StatusBadRequest)
        return nil
    }

    pricing, err := env.DB.GetUserPricing(userId)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return nil
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(pricing)
    return nil
}

func UpdateUserPricingHandler(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    var req models.UserPricing
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return nil
    }

    // Use the ToTime() method to get the time.Time from CustomTime
    expirationTime := req.Expiration.ToTime()

    err := env.DB.UpdateUserPricing(req.UserId, req.PricingPlanId, expirationTime)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return nil
    }

    w.WriteHeader(http.StatusOK)
    w.Write([]byte("Pricing plan updated successfully"))
    return nil
}
