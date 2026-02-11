package handler

import (
    "reflecto.trend/database"
    "log"
    "golang.org/x/oauth2"
	"net/http"
	"github.com/julienschmidt/httprouter"

)

func WrapInitGoogleAuth(env *Env, authConf *OauthConf, fn httprouter.Handle) func(e *Env, authConf *OauthConf, w http.ResponseWriter, r *http.Request) error {
	return func(e *Env, authConf *OauthConf, w http.ResponseWriter, r *http.Request) error {
		fn(w, r, httprouter.Params{})
		return nil
	}
}

func WrapGoogleAuthCallBack(env *Env, authConf *OauthConf, fn httprouter.Handle) func(e *Env, authConf *OauthConf, w http.ResponseWriter, r *http.Request) error {
	return func(e *Env, authConf *OauthConf, w http.ResponseWriter, r *http.Request) error {
		fn(w, r, httprouter.Params{})
		return nil
	}
}

// Error represents a handler error. It provides methods for a HTTP status
// code and embeds the built-in error interface.
type Error interface {
	error
	Status() int
}

// StatusError represents an error with an associated HTTP status code.
type StatusError struct {
	Code int
	Err  error
}

// Allows StatusError to satisfy the error interface.
func (se StatusError) Error() string {
	return se.Err.Error()
}

// Returns our HTTP status code.
func (se StatusError) Status() int {
	return se.Code
}

// A (simple) example of our application-wide configuration.
type Env struct {
	DB   database.Service
	Port int
	Host string
}

type OauthConf struct {
	OauthConf oauth2.Config
}

type OauthHandler struct {
	*Env
	*OauthConf
	H func(e *Env, authConf *OauthConf, w http.ResponseWriter, r *http.Request) error
}

// The Handler struct that takes a configured Env and a function matching
// our useful signature.
type Handler struct {
	*Env
	H func(e *Env, w http.ResponseWriter, r *http.Request) error
}


// ServeHTTP allows our Handler type to satisfy http.Handler.
func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	err := h.H(h.Env, w, r)
	if err != nil {
		switch e := err.(type) {
		case Error:
			// We can retrieve the status here and write out a specific
			// HTTP status code.
			log.Printf("HTTP %d - %s", e.Status(), e)
			http.Error(w, e.Error(), e.Status())
		default:
			// Any error types we don't specifically look out for default
			// to serving a HTTP 500
			http.Error(w, http.StatusText(http.StatusInternalServerError),
				http.StatusInternalServerError)
		}
	}
}


func (h OauthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	err := h.H(h.Env, h.OauthConf, w, r)
	if err != nil {
		switch e := err.(type) {
		case Error:
			// We can retrieve the status here and write out a specific
			// HTTP status code.
			log.Printf("HTTP %d - %s", e.Status(), e)
			http.Error(w, e.Error(), e.Status())
		default:
			// Any error types we don't specifically look out for default
			// to serving a HTTP 500
			http.Error(w, http.StatusText(http.StatusInternalServerError),
				http.StatusInternalServerError)
		}
	}
}

