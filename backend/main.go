package main

import (
	"fmt"
	"github.com/joho/godotenv"
	"github.com/julienschmidt/httprouter"
	"github.com/rs/cors"
	"github.com/stripe/stripe-go"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"reflecto.trend/database"
	"reflecto.trend/handler"
	"reflecto.trend/shares"
	"reflecto.trend/users"
	"strconv"
	"time"
    "flag"
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
    updateFlag := flag.Bool("u", false, "Set to true to update all stocks")
    flag.Parse()

    if *updateFlag {
        errr := shares.StockUpdateAll();
        if errr != nil {
            fmt.Println(errr)
            os.Exit(1)
        }
        os.Exit(0)
    }
	LoadEnv()
	db, err := database.NewDBConnection(
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_SSL_MODE"),
		os.Getenv("DB_SCHEMA"))
	if err != nil {
		fmt.Println(err)
		panic("cannot connect to database")
	}

	defer db.Close()

	port, err := strconv.Atoi(os.Getenv("PORT"))
	if err != nil {
		panic("cannot parse port number")
	}
	fmt.Println("Starting server on port", port)
	env := &handler.Env{
		DB:   db,
		Port: port,
		Host: "localhost",
	}

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", env.Port),
		Handler:      registerRoutes(env),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
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
			ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
			ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
			RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
			Endpoint:     google.Endpoint,
			Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email"},
		}}

	stripe.Key = os.Getenv("STRIPE_KEY")

	// Public routes
    r.Handler(http.MethodPost, "/auth/register", handler.Handler{Env: env, H: users.HandleRegister})
    r.Handler(http.MethodPost, "/auth/login", handler.Handler{Env: env, H: users.HandleLogin})
    r.Handler(http.MethodGet, "/api/confirmEmail", handler.Handler{Env: env, H: users.ConfirmEmail})
    r.Handler(http.MethodPost, "/api/resendVerificationEmail", handler.Handler{Env: env, H: users.ResendVerificationEmail})
    r.Handler(http.MethodPost, "/api/sendForgotPasswordEmail", handler.Handler{Env: env, H: users.SendForgotPasswordEmail})
    r.Handler(http.MethodPost, "/api/changePassword", handler.Handler{Env: env, H: users.ChangePassword})
    r.Handler(http.MethodPost, "/api/resetPassword", handler.Handler{Env: env, H: users.ResetPassword})
	r.Handler(http.MethodPost, "/api/confirmCaptcha", handler.Handler{Env: env, H: users.ConfirmCaptcha})
	r.Handler(http.MethodPost, "/auth/logout/", handler.Handler{Env: env, H: users.HandleLogout})

	// Protected routes
	r.GET("/api/getUserPricing", users.ValidateToken(env, users.GetUserPricingHandler(env)))
	r.POST("/api/updateUserPricing", users.ValidateToken(env, users.UpdateUserPricingHandler(env)))
	r.GET("/api/user", users.ValidateToken(env, users.GetCurrentUser(env)))
	r.POST("/api/analyse", users.ValidateToken(env, shares.HandleAnalyse(env)))
	r.POST("/api/updateAllStocks", users.ValidateToken(env, shares.HandleUpdateAllStocks(env)))
	r.POST("/api/updateStock", users.ValidateToken(env, shares.HandleUpdateStock(env)))
	r.GET("/api/getStockList", users.ValidateToken(env, shares.HandleGetStockList(env)))
	r.POST("/api/getStockData", users.ValidateToken(env, shares.HandleGetStockData(env)))
	r.POST("/api/createPaymentIntent", users.ValidateToken(env, users.HandleCreatePaymentIntent(env)))
	r.POST("/api/createPaymentMethod", users.ValidateToken(env, users.HandleCreatePaymentMethod(env)))
	r.POST("/api/generateSD", users.ValidateToken(env, shares.HandleGenerateSD(env)))
	r.POST("/auth/authCheck", users.ValidateToken(env, users.HandleAuthorization(env)))
	r.GET("/auth/user", users.ValidateToken(env, users.HandleGetUser(env)))
	r.Handler(http.MethodPost, "/auth/refresh/", handler.Handler{Env: env, H: users.HandleRefresh})

	r.Handler(http.MethodPost, "/api/initGoogleAuth", handler.OauthHandler{Env: env, OauthConf: myAuthConf, H: handler.WrapInitGoogleAuth(env, myAuthConf, users.InitGoogleAuth(env, myAuthConf))})
	r.Handler(http.MethodPost, "/api/googleAuthCallback", handler.OauthHandler{Env: env, OauthConf: myAuthConf, H: handler.WrapGoogleAuthCallBack(env, myAuthConf, users.GoogleAuthCallBack(env, myAuthConf))})

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{os.Getenv("site_url")},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           900,  //(in seconds)
		Debug:            true, // Enable this to debug
	})
	handler := c.Handler(r)
	return handler
}
