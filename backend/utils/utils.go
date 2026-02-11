package utils

import (
	"bytes"
	"fmt"
	mail "github.com/xhit/go-simple-mail/v2"
	"os"
    "io"
	"reflecto.trend/models"
	"text/template"
	"time"
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/hex"
    "encoding/json"
)

var From = "noreply@" + os.Getenv("DOMAIN")
var UnsubscribeLink = "https://" + os.Getenv("DOMAIN") + "/unsubscribe"
var ProductUrl = "https://" + os.Getenv("DOMAIN") + "/"
var ResetPasswordUrl = "https://" + os.Getenv("DOMAIN") + "/resetPassword?token="
var ContactUsUrl = "https://" + os.Getenv("DOMAIN") + "/contact-us"
var ConfirmEmailUrl = "https://" + os.Getenv("DOMAIN") + "/api/confirmEmail?token="

func Atoi(s string) int {
	i := 0
	for _, r := range s {
		i = i*10 + int(r-'0')
	}
	return i
}


func Encrypt(text []byte) (string) {
    secretKey := os.Getenv("VERIFICATION_SECRET_KEY")
    key := []byte(secretKey)

    block, err := aes.NewCipher(key)
    if err != nil {
        fmt.Println(err)
        return ""
    }
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        fmt.Println(err)
        return ""
    }

    nonce := make([]byte, gcm.NonceSize())
    if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
        fmt.Println(err)
        return ""
    }

    ciphertext := gcm.Seal(nonce, nonce, text, nil)
    enc := hex.EncodeToString(ciphertext)
    return enc
}

func Decrypt(encryptedStr string) ([]byte) {
    secretKey := os.Getenv("VERIFICATION_SECRET_KEY")
    key := []byte(secretKey)

    decodedCipherText, err := hex.DecodeString(encryptedStr)
    if err != nil {
        fmt.Println("error decoding token", err)
        return nil
    }

    block, err := aes.NewCipher(key)
    if err != nil {
        fmt.Println(err)
        return nil
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        fmt.Println(err)
        return nil
    }

    decryptedData, err := gcm.Open(nil, decodedCipherText[:gcm.NonceSize()], decodedCipherText[gcm.NonceSize():], nil)
    if err != nil {
        fmt.Println("error decrypting data", err)
        return nil
    }
    return decryptedData
}

func SendWelcomeEmail(email string) error {
    token := models.EmailVerificationToken{
        Email: email,
        Expiration: time.Now().UTC().Add(30 * time.Minute),
    }

    jsonBytes, err := json.Marshal(token)
    if err != nil {
        return err
    }

	data := models.EmailData{
		UnsubscribeLink: UnsubscribeLink,
		ProductUrl:      ProductUrl,
		ContactUsUrl:    ContactUsUrl,
		VerifyLink:      ConfirmEmailUrl + Encrypt(jsonBytes),
	}
	sub := "Welcome to Reflecto Trend"
	currentDir, _ := os.Getwd()
	templateFile := currentDir + "/email-templates/welcome.html"

    return SendEmail(email, data, sub, templateFile)
}

func SendForgotPasswordEmail(email string) error {
    token := models.EmailVerificationToken{
        Email: email,
        Expiration: time.Now().UTC().Add(30 * time.Minute),
    }

    jsonBytes, err := json.Marshal(token)
    if err != nil {
        return err
    }
	data := models.EmailData{
		UnsubscribeLink: UnsubscribeLink,
		ProductUrl:      ProductUrl,
		ContactUsUrl:    ContactUsUrl,
        ResetPasswordLink : ResetPasswordUrl + Encrypt(jsonBytes),
	}
	sub := "Password Reset Link"
	currentDir, _ := os.Getwd()
	templateFile := currentDir + "/email-templates/password-reset.html"
    return SendEmail(email, data, sub, templateFile)
}

func SendEmail(to string, data models.EmailData, subject string, templateFile string) error {
	t, _ := template.ParseFiles(templateFile)
	var body bytes.Buffer

	err := t.Execute(&body, data)
	if err != nil {
		fmt.Println(err)
		return err
	}

	server := mail.NewSMTPClient()
	server.Host = os.Getenv("SMTP_HOST")
	server.Port = 25
	server.KeepAlive = false
	server.ConnectTimeout = 10 * time.Second
	server.SendTimeout = 10 * time.Second

	smtpClient, err := server.Connect()
	if err != nil {
		fmt.Println(err)
		return err
    }

	email := mail.NewMSG()
	email.SetFrom(From).
		AddTo(to).
		SetSubject(subject)

	email.SetBody(mail.TextHTML, body.String())
	return email.Send(smtpClient)
}
