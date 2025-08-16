import CryptoJS from "crypto-js";

const key = CryptoJS.SHA3(
    "U%W[HPW=POE!M}&E__WE:WO[O=]QYM~5WSF=*#HH;~W{J3E~+L![L-H+X=YX_+^@Z:3YSOI-2G:[:LL!T!OG@FELEPK4^R_K",
    {}
).toString(CryptoJS.enc.Base64);
const secret = CryptoJS.enc.Utf8.parse(key);
const IV_LENGTH = 16;

export const encryptData = (data) => {
    const ciphertext = data.toString();
    const iv = CryptoJS.lib.WordArray.random(IV_LENGTH);
    const options = { mode: CryptoJS.mode.CBC, iv };
    const encoded = CryptoJS.AES.encrypt(ciphertext, secret, options);
    const bytes = encoded.iv.concat(encoded.ciphertext);
    return bytes.toString(CryptoJS.enc.Base64);
};

export const decryptData = (encryptedData) => {
    const buf = CryptoJS.enc.Base64.parse(encryptedData);
    const bytes = CryptoJS.enc.Hex.stringify(buf);
    const iv = CryptoJS.enc.Hex.parse(bytes.slice(0, IV_LENGTH * 2));
    const ciphertext = CryptoJS.enc.Hex.parse(bytes.slice(IV_LENGTH * 2));
    const options = { mode: CryptoJS.mode.CBC, iv };
    const decoded = CryptoJS.AES.decrypt({ ciphertext }, secret, options);
    return decoded.toString(CryptoJS.enc.Utf8);
}

export const userNameError = (username) => {
    if (username.trim().length == 0 && username.match(/^[0-9a-zA-Z]+$/) === null) {
        return true;
    }
    return false;
}

export const passwordMatch = (password1, password2) => {
    if (password2.length > 0) {
        if (password1 === password2) {
            return true;
        } else {
            return false;
        }
    }
}

export const titleCaseString = (str) => {
    return str.toLowerCase().replace(/(^|\s)(\w)/g, function (x) {
        return x.toUpperCase();
    });
}

export const isEmail = (inputText) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(inputText);
}
