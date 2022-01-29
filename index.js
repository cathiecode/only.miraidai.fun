const PORT = process.env.PORT ?? 8080;
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;
const SECRET = process.env.SECRET;

const HOPE_LOGIN_URL = (serviceUrl) => `https://hope.c.fun.ac.jp/cas/login?service=${encodeURI(serviceUrl)}`;
const VALIDATION_URL = (serviceUrl) => `https://hope.c.fun.ac.jp/cas/validate?service=${encodeURI(serviceUrl)}&ticket=`;

const fetch = require("node-fetch");

const validateCASTicket = async (ticket, serviceUrl) => {
  if (!ticket) {
    throw "No ticket; failed to authentication?"
  }

  const validationResponse = await fetch(VALIDATION_URL(serviceUrl) + ticket);

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
const cookieParser = require('cookie-parser');

const { getUrlById, storeUrl } = require("./bq");

const isValidUrl = (url) => {
  const urlObject = new URL(url);
  if (urlObject.protocol !== "https:" && urlObject.protocol !== "http:") {
    return false;
  }
  return true;
}

const app = express();

app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

// 認証系
app.use((req, res, next) => {
  res.locals.isSignedIn = false;
  res.locals.authError = null;

  if (!req.cookies.signin) {
    return next();
  }

  try {
    let signin;
    try {
      signin = jwt.verify(req.cookies.signin, SECRET);
    } catch (e) {
      res.locals.authError = "ログイン状況の確認に失敗しました。";
      return;
    }
    if (!signin) {
      res.locals.authError = "ログインセッションが切れています。もう一度ログインする必要があります。";
      return;
    }
  } catch (e) {
    res.status(500);
    res.send("内部エラーが発生しました。");
    console.log("Internal error", e);
    return;
  }

  res.locals.isSignedIn = true;

  return next();
});

app.get("/signin", (req, res) => {
  let error = undefined;
  if (req.query.error) {
    error = decodeURI(req.query.error);
  }
  const redirect = jwt.verify(req.query.redirect, SECRET);

  res.render("login", { base_url: BASE_URL, redirect: jwt.sign(redirect, SECRET), error: error});
});

app.get("/signin_hope", (req, res) => {
  const redirect = jwt.verify(req.query.redirect, SECRET);

  if (!redirect) {
    res.status(403);
    res.send("Redirect destination is invalid");
  }

  validateCASTicket(req.query.ticket, BASE_URL + "/signin_hope?redirect=" + req.query.redirect)
    .then((id) => {
      res.cookie("signin", jwt.sign({
        id: id
      }, SECRET));
      res.redirect(redirect);
    })
    .catch((e) => {
      res.status(403);
      res.send(e);
    })
});

// アプリケーション

const redirectToSignIn = (req, res) => {
  if (res.locals.authError) {
    res.redirect("/signin?" + new URLSearchParams([["redirect", jwt.sign(req.originalUrl, SECRET)], ["error", res.locals.authError]]));
  } else {
    res.redirect("/signin?" + new URLSearchParams([["redirect", jwt.sign(req.originalUrl, SECRET)]]));
  }
}

app.get("/", (req, res) => {
  if (!res.locals.isSignedIn) {
    return redirectToSignIn(req, res);
  }

  res.render("index");
});

app.get("/about", (req, res) => {
  res.render("index");
})

app.get("/:id", (req, res) => {
  if (!res.locals.isSignedIn) {
    return redirectToSignIn(req, res);
  }

  if (!/^[a-zA-Z0-9].+$/.test(req.params.id)) {
    res.status(404);
    res.render("notfound");
    return;
  }
  
  try {
    getUrlById(req.params.id)
      .then((url) => {
        if (!url || url === "") {
          throw "notfound"
        }
        res.redirect(url);
      })
      .catch((e) => {
        res.status(404);
        res.render("notfound");
      })
    return;
  } catch (e) {
    res.status(500);
    res.send("内部エラーが発生しました。");
    console.log("Internal error", e);
    return;
  }
});

app.post("/url", (req, res) => {
  if (!res.locals.isSignedIn) {
    res.status(403);
    res.send("log in first.");
    return;
  }
  let is_valid_url;
  try {
    is_valid_url = isValidUrl(req.body.url);
  } catch(e) {
    is_valid_url = false;
  }
  if (!is_valid_url) {
    res.status(400);
    res.send("URLの形式が不正です");
    return;
  }
  storeUrl(req.body.url, "anonymous")
    .then(id => {
      res.status(200);
      res.send(BASE_URL + "/" + id);
    })
    .catch(e => {
      res.status(500);
      res.send("内部エラーが発生しました。");
      console.log("Internal error", e);
    })
});

app.listen(PORT);
