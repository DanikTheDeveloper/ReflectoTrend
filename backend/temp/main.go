package main

import (
    "fmt"
    "io/ioutil"
    "net/http"
    "net/url"
    "strings"
)

func main() {
    apiKey := "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"
    data := url.Values{}
    data.Set("amount", "2000")
    data.Set("currency", "usd")
    data.Set("payment_method_types[]", "card")

    client := &http.Client{}
    req, err := http.NewRequest("POST", "https://api.stripe.com/v1/payment_intents", strings.NewReader(data.Encode()))
    if err != nil {
        fmt.Println("Error creating request:", err)
        return
    }

    req.Header.Add("Authorization", "Bearer "+apiKey)
    req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

    resp, err := client.Do(req)
    if err != nil {
        fmt.Println("Error sending request to Stripe:", err)
        return
    }
    defer resp.Body.Close()
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        fmt.Println("Error reading response body:", err)
        return
    }

    fmt.Println("Response status:", resp.Status)
    fmt.Println("Response body:", string(body))
}

