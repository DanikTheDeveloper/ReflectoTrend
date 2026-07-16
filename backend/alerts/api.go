package alerts

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"reflecto.trend/handler"
	"reflecto.trend/models"
	"strconv"
	"strings"

	"github.com/julienschmidt/httprouter"
)

const maxActiveAlerts = 20

func writeJSONError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(map[string]string{"error": message}); err != nil {
		log.Printf("Error encoding error response: %v\n", err)
	}
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("Error encoding response: %v\n", err)
	}
}

type asset struct {
	Name string `json:"name"`
	Code string `json:"code"`
}

func symbolExists(symbol string) bool {
	data, err := os.ReadFile("./shares/sd.json")
	if err != nil {
		return false
	}
	var assets []asset
	if err := json.Unmarshal(data, &assets); err != nil {
		return false
	}
	for _, a := range assets {
		if a.Code == symbol {
			return true
		}
	}
	return false
}

var validConditions = map[string]bool{
	"above":      true,
	"below":      true,
	"pct_change": true,
}

func HandleCreateAlert(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		email := r.Context().Value("email").(string)

		var req models.CreateAlertRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONError(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if !validConditions[req.Condition] {
			writeJSONError(w, "condition must be 'above', 'below', or 'pct_change'", http.StatusBadRequest)
			return
		}
		if req.TargetValue <= 0 {
			writeJSONError(w, "target_value must be positive", http.StatusBadRequest)
			return
		}
		if !symbolExists(req.Symbol) {
			writeJSONError(w, "symbol not found", http.StatusBadRequest)
			return
		}
		if req.Condition == "pct_change" && req.WindowMinutes == nil {
			writeJSONError(w, "window_minutes is required for pct_change condition", http.StatusBadRequest)
			return
		}

		alerts, err := env.DB.ListAlertsByUser(email)
		if err != nil {
			log.Printf("Error listing alerts: %v\n", err)
			writeJSONError(w, "Server error", http.StatusInternalServerError)
			return
		}
		activeCount := 0
		for _, a := range alerts {
			if a.Status == "active" {
				activeCount++
			}
		}
		if activeCount >= maxActiveAlerts {
			writeJSONError(w, "Maximum active alerts limit reached", http.StatusBadRequest)
			return
		}

		repeatInt := 0
		if req.Repeat {
			repeatInt = 1
		}
		alert, err := env.DB.CreateAlert(email, req.Symbol, req.Condition, req.TargetValue, req.WindowMinutes, repeatInt)
		if err != nil {
			log.Printf("Error creating alert: %v\n", err)
			writeJSONError(w, "Server error", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		writeJSON(w, alert)
	}
}

func HandleListAlerts(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		email := r.Context().Value("email").(string)

		alerts, err := env.DB.ListAlertsByUser(email)
		if err != nil {
			log.Printf("Error listing alerts: %v\n", err)
			writeJSONError(w, "Server error", http.StatusInternalServerError)
			return
		}
		if alerts == nil {
			alerts = []models.Alert{}
		}

		writeJSON(w, alerts)
	}
}

func HandleDeleteAlert(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		email := r.Context().Value("email").(string)

		idStr := ps.ByName("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			writeJSONError(w, "Invalid alert id", http.StatusBadRequest)
			return
		}

		if err := env.DB.DeleteAlert(id, email); err != nil {
			if strings.Contains(err.Error(), "no rows") {
				writeJSONError(w, "Alert not found", http.StatusNotFound)
				return
			}
			log.Printf("Error deleting alert %d: %v\n", id, err)
			writeJSONError(w, "Server error", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		writeJSON(w, map[string]string{"status": "deleted"})
	}
}

func HandleUpdateAlert(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		email := r.Context().Value("email").(string)

		idStr := ps.ByName("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			writeJSONError(w, "Invalid alert id", http.StatusBadRequest)
			return
		}

		var req models.UpdateAlertRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONError(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		anyUpdate := false

		if req.Status != nil && *req.Status != "active" && *req.Status != "disabled" {
			writeJSONError(w, "status must be 'active' or 'disabled'", http.StatusBadRequest)
			return
		}

		if req.Status != nil {
			if err := env.DB.UpdateAlertStatusOnly(id, email, *req.Status); err != nil {
				if strings.Contains(err.Error(), "no rows") {
					writeJSONError(w, "Alert not found", http.StatusNotFound)
					return
				}
				log.Printf("Error updating alert status %d: %v\n", id, err)
				writeJSONError(w, "Server error", http.StatusInternalServerError)
				return
			}
			anyUpdate = true
		}

		if req.TargetValue != nil {
			if err := env.DB.UpdateAlertTarget(id, email, *req.TargetValue); err != nil {
				if strings.Contains(err.Error(), "no rows") {
					writeJSONError(w, "Alert not found", http.StatusNotFound)
					return
				}
				log.Printf("Error updating alert target %d: %v\n", id, err)
				writeJSONError(w, "Server error", http.StatusInternalServerError)
				return
			}
			anyUpdate = true
		}

		if req.Repeat != nil {
			repeatVal := 0
			if *req.Repeat {
				repeatVal = 1
			}
			if err := env.DB.UpdateAlertRepeat(id, email, repeatVal); err != nil {
				if strings.Contains(err.Error(), "no rows") {
					writeJSONError(w, "Alert not found", http.StatusNotFound)
					return
				}
				log.Printf("Error updating alert repeat %d: %v\n", id, err)
				writeJSONError(w, "Server error", http.StatusInternalServerError)
				return
			}
			anyUpdate = true
		}

		if !anyUpdate {
			writeJSONError(w, "No fields to update", http.StatusBadRequest)
			return
		}

		alert, err := env.DB.GetAlertByID(id)
		if err != nil {
			if strings.Contains(err.Error(), "no rows") {
				writeJSONError(w, "Alert not found", http.StatusNotFound)
				return
			}
			log.Printf("Error fetching updated alert %d: %v\n", id, err)
			writeJSONError(w, "Server error", http.StatusInternalServerError)
			return
		}

		writeJSON(w, alert)
	}
}
