const PORT = process.env.PORT ?? 8080;
const BASE_URL = process.env.BASE_URL ?? "http://localhost:8080";
const SECRET = process.env.SECRET;

const HOPE_LOGIN_URL = (serviceUrl) => `https://hope.c.fun.ac.jp/cas/login?service=${encodeURI(serviceUrl)}`;
const VALIDATION_URL = (serviceUrl) => `https://hope.c.fun.ac.jp/cas/validate?service=${encodeURI(serviceUrl)}&ticket=`;

const fetch = require("node-fetch");

const validateCASTicket = async (ticket, serviceUrl) => {
  if (!ticket) {
    throw "No ticket; failed to authentication?"
  }

  const validationResponse = await fetch(VALIDATION_URL(serviceUrl) + ticket);
  console.log("validating", VALIDATION_URL(serviceUrl) + ticket);

  if (!validationResponse.ok) {
    throw "Failed to redeem ticket; failed to authentication?"
  }

  const validationResponseText = await validationResponse.text();

  const validationResponseArray = validationResponseText.split("\n");

  if (validationResponseArray[0] !== "yes") {
    if (validationResponseArray[0] === "no") {
      throw "Failed to redeem ticket; is it valid ticket?"
    } else {
      throw "Failed to parse validation; is hope alive?"
    }

  } else {
    return validationResponseArray[1];
  }
}

// App

const jwt = require("jsonwebtoken");
const express = require("express");
var cookieParser = require('cookie-parser')



const app = express();

app.use(cookieParser());

app.get("/signin_hope", (req, res) => {
  const redirect = jwt.verify(req.query.redirect, SECRET);

  if (!redirect) {
    res.status(403);
    res.send("Redirect destination is invalid");
  }

  validateCASTicket(req.query.ticket, BASE_URL + "/signin_hope?redirect=" + req.query.redirect)
    .then((id) => {
      console.log("well done!", redirect);
      res.cookie("signin", jwt.sign({
        id: id
      }, SECRET));
      res.redirect(redirect);
    })
    .catch((e) => {
      res.status(403);
      res.send(e);
    })
})

app.get("/:id", (req, res) => {
  if (req.cookies.signin) {
    const signin = jwt.verify(req.cookies.signin, SECRET);
    if (signin) {

      getUrlById(req.params.id)
        .then((url) => {
          res.send(`ようこそ、${signin.id}さん。<a href="${url}">リンクはこちらです</a>。`);
        })
        .catch(() => {
          res.status(404);
          res.send("すみません、お探しのリンクは見つかりませんでした");
        })
      return;
    }
  }
  res.status(403);
  res.send(`この先のページに進むにはログインする必要があります: <a href="${HOPE_LOGIN_URL(BASE_URL + "/signin_hope?redirect=" + jwt.sign(BASE_URL + "/" + req.params.id, SECRET))}">HOPEでログイン</a>`);
  return;
})

app.post("/url", (req, res) => {
  if (req.cookies.signin) {
    const signin = jwt.verify(req.cookies.signin, SECRET);
    if (!signin) {
      res.status(403);
      res.send(`この先のページに進むにはログインする必要があります: <a href="${HOPE_LOGIN_URL(BASE_URL + "/signin_hope?redirect=" + jwt.sign(BASE_URL + "/" + req.params.id, SECRET))}">HOPEでログイン</a>`);
      return;
    }
  }
})

app.listen(PORT);
