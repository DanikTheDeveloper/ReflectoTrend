package users

import (
    jwt "github.com/golang-jwt/jwt/v5"
    "time"
    "os"
    "errors"
    "log"
    "encoding/json"
)

const privKeyFile = "keys/private_key.pem"
const pubKeyFile  = "keys/pubkey.pem"

const RefreshTokenValidTime = time.Hour * 72
const AuthTokenValidTime = time.Minute * 15

const Issuer string = "ReflectoTrend"

type ReflectoClaims struct {
    TokenType string `json:"tokenType"`
    jwt.RegisteredClaims
}

func customParser(token string) (*jwt.Token, error) {
    cur_dir, err := os.Getwd()
    if err != nil {
        return nil, err
    }
    verifyBytes, err := os.ReadFile(cur_dir + "/" + pubKeyFile)
    if err != nil {
        return nil, err
    }
    verifyKey, err := jwt.ParseRSAPublicKeyFromPEM(verifyBytes)
    if err != nil {
        return nil, err
    }

    parsedToken, err := jwt.Parse(
        token,
        func(token *jwt.Token) (interface{}, error) {
            return verifyKey, nil
        },
    )
    if err != nil || !parsedToken.Valid{
        return nil, errors.New("Invalid token")
    }
    return parsedToken, err
}

func getTokenExpirationTime(token string) (time.Time, error) {
    parsedToken, err := customParser(token)
    jsonString, err := json.Marshal(parsedToken.Claims)
    if err != nil {
        return time.Now().UTC(), err
    }
    claims := ReflectoClaims{}
    if json.Unmarshal(jsonString, &claims) != nil {
        return time.Now().UTC(), errors.New("Invalid token")
    }
    if claims.ExpiresAt.Before(time.Now().UTC()) {
        return time.Now().UTC(), errors.New("Token has expired")
    }
    return claims.ExpiresAt.UTC(), nil
}

func DecodeAuthToken(token string) (string, error) {
    if (len(token) < 8) {
        return "", errors.New("token length too small")
    }
    token = token[7:]
    parsedToken, err := customParser(token)
    if err != nil {
        return "", err
    }
    jsonString, err := json.Marshal(parsedToken.Claims)
    if err != nil {
        return "", err
    }
    claims := ReflectoClaims{}
    if json.Unmarshal(jsonString, &claims) != nil {
        return "", errors.New("Invalid token")
    }
    if claims.TokenType != "auth" {
        return "", errors.New("Invalid token type")
    }
    if claims.ExpiresAt.Before(time.Now().UTC()) {
        return "", errors.New("Token has expired")
    }
    sub, err := parsedToken.Claims.GetSubject()
    if err != nil {
        return "", err
    }
    return sub, nil
}

func DecodeRefreshToken(token string) (string, error) {
    parsedToken, err := customParser(token)
    if err != nil {
        return "", err
    }
    jsonString, err := json.Marshal(parsedToken.Claims)
    if err != nil {
        return "", err
    }
    claims := ReflectoClaims{}
    if json.Unmarshal(jsonString, &claims) != nil {
        return "", errors.New("Invalid token")
    }
    if claims.TokenType != "refresh" {
        return "", errors.New("Invalid token type")
    }
    if claims.ExpiresAt.Before(time.Now().UTC()) {
        return "", errors.New("Token has expired")
    }
    sub, err := parsedToken.Claims.GetSubject()
    println(sub)
    if err != nil {
        return "", err
    }
    return sub, nil
}

func CreateTokens(email string) (string, string, error) {
    authClaims := ReflectoClaims{
        "auth",
        jwt.RegisteredClaims{
            Issuer:    Issuer,
            IssuedAt:  jwt.NewNumericDate(time.Now().UTC()),
            ExpiresAt: jwt.NewNumericDate(time.Now().UTC().Add(1 * time.Hour)),
            NotBefore: jwt.NewNumericDate(time.Now().UTC()),
            Subject:   email,
            ID:        "1",
            Audience:  jwt.ClaimStrings{os.Getenv("site_url")},
        },
    }


    refreshClaims := ReflectoClaims{
        "refresh",
        jwt.RegisteredClaims{
            Issuer:    Issuer,
            IssuedAt:  jwt.NewNumericDate(time.Now().UTC()),
            ExpiresAt: jwt.NewNumericDate(time.Now().UTC().Add(72 * time.Hour)),
            NotBefore: jwt.NewNumericDate(time.Now().UTC()),
            Subject:   email,
            ID:        "1",
            Audience:  jwt.ClaimStrings{os.Getenv("site_url")},
        },
    }

    cur_dir, err := os.Getwd()
    if err != nil {
        return "", "", err
    }

    privBytes, err := os.ReadFile(cur_dir + "/" + privKeyFile)
    if err != nil {
        log.Println("error reading privKey", err)
        return "", "", err
    }
    privKey, err := jwt.ParseRSAPrivateKeyFromPEM(privBytes)
    if err != nil {
        log.Println("error parsing privKey", err)
        return "", "", err
    }

    authToken, err := jwt.NewWithClaims(jwt.GetSigningMethod("RS256"), authClaims).SignedString(privKey)
    if err != nil {
        log.Println("Error signing token:", err)
        return "", "", err
    }

    refreshToken, err := jwt.NewWithClaims(jwt.GetSigningMethod("RS256"), refreshClaims).SignedString(privKey)
    if err != nil {
        log.Println("Error signing token:", err)
        return "", "", err
    }

    return authToken, refreshToken, nil
}
