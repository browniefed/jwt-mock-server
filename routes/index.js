var express = require("express");
var router = express.Router();
var getKeyStore = require("../jwt/keyStore.js").getKeyStore;
var jose = require("node-jose");

router.get("/", function (req, res, next) {
  res.json({ hello: "world!" });
});

router.get("/shutdown", function (req, res, next) {
  res.json({ hello: "world!" });
});

router.get("/.well-known/jwks.json", async function (req, res) {
  var keys = await getKeyStore();
  res.json(keys.toJSON());
});

router.post("/token", async function (req, res) {
  var keys = await getKeyStore();
  var key = keys.all()[0];
  var body = req.body;
  body["iat"] = Math.floor(Date.now() / 1000);
  body["exp"] = Math.floor(Date.now() / 1000) + 3600;
  var token = await new Promise((resolve) => {
    jose.JWS.createSign({ alg: "RS256", format: "compact" }, key)
      .update(JSON.stringify(req.body))
      .final()
      .then(function (result) {
        resolve(result);
      });
  });
  res.json({ token: token });
});

function getDefaultJwtClaim() {
  return {
    "https://hasura.io/jwt/claims": {
      "x-hasura-user-id": "123",
      "x-hasura-allowed-roles": ["user"],
      "x-hasura-default-role": "user",
    },
  };
}

router.get("/token", async function (req, res) {
  var keys = await getKeyStore();
  var key = keys.all()[0];
  var body =
    Object.keys(req.query).length > 0 ? req.query : getDefaultJwtClaim();

  body["iat"] = Math.floor(Date.now() / 1000);
  body["exp"] = Math.floor(Date.now() / 1000) + 3600;

  var token = await new Promise((resolve) => {
    jose.JWS.createSign({ alg: "RS256", format: "compact" }, key)
      .update(JSON.stringify(body))
      .final()
      .then(function (result) {
        resolve(result);
      });
  });
  res.json({ token: token });
});

module.exports = router;
