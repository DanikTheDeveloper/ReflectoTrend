package main

import (
    "reflecto.trend/database"
    "reflecto.trend/users"
    "reflecto.trend/shares"
    "reflecto.trend/handler"
    "net/http"
    "fmt"
    "path/filepath"
    "os"
    "log"
    "github.com/julienschmidt/httprouter"
	"github.com/rs/cors"
    "github.com/joho/godotenv"
    "time"
    "github.com/stripe/stripe-go"
    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"
)

func LoadEnv() {
    wd, err := os.Getwd()
    if err != nil {
        log.Fatal("Error getting the current working directory")
    }
    envFile := filepath.Join(wd, ".env")
    err = godotenv.Load(envFile)
    if err != nil {
        log.Fatal("Error loading .env file")
    }
}

func main() {
    LoadEnv()
    db, err := database.NewDBConnection(
        os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"), os.Getenv("DB_SSL_MODE"))
    if err != nil {
        fmt.Println(err)
        panic("cannot connect to database")
    }

    defer db.Close();

    var port = 8081
    env := &handler.Env{
        DB: db,
        Port: port,
        Host: "localhost",
    }

    server := &http.Server{
        Addr:           fmt.Sprintf(":%d", env.Port),
        Handler:        registerRoutes(env),
        IdleTimeout:    time.Minute,
        ReadTimeout:    10 * time.Second,
        WriteTimeout: 30 * time.Second,
    }

    err = server.ListenAndServe()
    if err != nil {
        fmt.Println(err)
        panic("cannot start server")
    }
}

func registerRoutes(env *handler.Env) http.Handler {
    r := httprouter.New()

    myAuthConf := &handler.OauthConf{
        OauthConf: oauth2.Config{
        ClientID:        os.Getenv("GOOGLE_CLIENT_ID"),
        ClientSecret:    os.Getenv("GOOGLE_CLIENT_SECRET"),
        RedirectURL:     os.Getenv("GOOGLE_REDIRECT_URL"),
        Endpoint:        google.Endpoint,
        Scopes:          []string{"https://www.googleapis.com/auth/userinfo.email"},
    }}

    // Your Stripe secret key should be set here
	stripe.Key = "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"

    //email
    r.Handler(http.MethodPost, "/api/confirmEmail", handler.Handler{Env: env, H: users.ConfirmEmail})
    r.Handler(http.MethodPost, "/api/sendForgotPasswordEmail", handler.Handler{Env: env, H: users.SendForgotPasswordEmail})
    r.Handler(http.MethodPost, "/api/resetPassword", handler.Handler{Env: env, H: users.ResetPassword})
    r.Handler(http.MethodPost, "/api/changePassword", handler.Handler{Env: env, H: users.ChangePassword})


	// Setup your routes
    // pricing start
    http.HandleFunc("/api/createPaymentMethod", func(w http.ResponseWriter, r *http.Request) {
        if err := users.HandleCreatePaymentMethod(env, w, r); err != nil {
            fmt.Println("Error handling create payment method:", err)
        }
    })
    http.ListenAndServe(":8080", nil)
    r.Handler( http.MethodPost, "/api/createPaymentIntent", handler.Handler{env, users.HandleCreatePaymentIntent})
    r.Handler( http.MethodGet, "/api/getUserPricing", handler.Handler{env, users.GetUserPricingHandler})
    r.Handler( http.MethodPost, "/api/updateUserPricing", handler.Handler{env, users.UpdateUserPricingHandler})
    r.Handler(http.MethodGet, "/api/user", handler.Handler{Env: env, H: users.GetCurrentUser})
    // pricing end

    r.Handler( http.MethodGet, "/", handler.Handler{env, users.GetIndex})
    r.HandlerFunc(http.MethodPost, "/api/analyse", shares.HandleAnalyse)
    r.HandlerFunc(http.MethodPost, "/api/updateAllStocks", shares.HandleUpdateAllStocks)
    r.HandlerFunc(http.MethodPost, "/api/updateStock", shares.HandleUpdateStock)
    r.HandlerFunc(http.MethodGet, "/api/getStockList", shares.HandleGetStockList)
    r.Handler(http.MethodPost, "/api/getStockData", handler.Handler{env, shares.HandleGetStockData})
    r.HandlerFunc(http.MethodPost, "/api/generateSD", GenerateSDHandler)
    r.Handler( http.MethodPost, "/auth/register", handler.Handler{env, users.HandleRegister})
    r.Handler( http.MethodPost, "/auth/login", handler.Handler{env, users.HandleLogin})
    r.Handler( http.MethodPost, "/auth/logout", handler.Handler{env, users.HandleLogout})
    r.Handler( http.MethodPost, "/auth/authCheck", handler.Handler{env, users.HandleAuthorization})
    r.Handler( http.MethodGet, "/auth/user", handler.Handler{env, users.HandleGetUser})
    r.Handler( http.MethodPost, "/auth/refresh", handler.Handler{env, users.HandleRefresh})
    r.Handler( http.MethodPost, "/api/confirmCaptcha", handler.Handler{env, users.ConfirmCaptcha})

    // google auth
    r.Handler( http.MethodPost, "/api/initGoogleAuth", handler.OauthHandler{env, myAuthConf, users.InitGoogleAuth})
    r.Handler( http.MethodPost, "/api/googleAuthCallback", handler.OauthHandler{env, myAuthConf, users.GoogleAuthCallBack})

		c := cors.New(cors.Options{
        AllowedOrigins:   []string{"*"}, // Allows all origins
        AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
        ExposedHeaders:   []string{"Link"},
        AllowCredentials: true,
        MaxAge:           900, // Maximum value not to perform a preflight request (in seconds)
        // Debug:            true, // Enable this to debug
    })
		handler := c.Handler(r)
    return handler
}


func GenerateSDHandler(w http.ResponseWriter, r *http.Request) {
    // Call the shares.GenerateSD function here
    shares.GenerateSD()

    // You might want to send back a response indicating success or failure
    // For example, sending a simple success message:
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("GenerateSD executed successfully"))
}
