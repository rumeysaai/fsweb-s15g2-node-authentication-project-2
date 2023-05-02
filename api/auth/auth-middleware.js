const { JWT_SECRET } = require("../secrets"); // bu secreti kullanın!
const UserModel = require('../users/users-model');
const jwt = require('jsonwebtoken');
const bcryptjs = require("bcryptjs");

const sinirli = (req, res, next) => {
  /*
    Eğer Authorization header'ında bir token sağlanmamışsa:
    status: 401
    {
      "message": "Token gereklidir"
    }

    Eğer token doğrulanamıyorsa:
    status: 401
    {
      "message": "Token gecersizdir"
    }

    Alt akıştaki middlewarelar için hayatı kolaylaştırmak için kodu çözülmüş tokeni req nesnesine koyun!
  */
  try {

    let token = req.headers["authorization"]
    if (token) {
      jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
        if (err) {
          next({ status: 401, message: "Token geçersizdir" })
        }
        else {
          req.decodedToken = decodedToken
          next();
        }
      })
    }
    else {
      next({ status: 401, message: "Token gereklidir" })
    }

  } catch (error) {
    next(error);
  }

}

const sadece = role_name => (req, res, next) => {
  /*
    
  Kullanıcı, Authorization headerında, kendi payloadu içinde bu fonksiyona bağımsız değişken olarak iletilen 
  rol_adı ile eşleşen bir role_name ile bir token sağlamazsa:
    status: 403
    {
      "message": "Bu, senin için değil"
    }

    Tekrar authorize etmekten kaçınmak için kodu çözülmüş tokeni req nesnesinden çekin!
  */
  try {

    if (role_name !== req.decodedToken.rolename) {
      next({ status: 403, message: "Bu, senin için değil" })
    }
    else {
      next();
    }
  } catch (error) {
    next(error);
  }

}


const usernameVarmi = async (req, res, next) => {
  /*
    req.body de verilen username veritabanında yoksa
    status: 401
    {
      "message": "Geçersiz kriter"
    }
  */
  try {

    const userByUsername = await UserModel.goreBul({ username: req.body.username });
    const isValidLogin = userByUsername && userByUsername.length > 0 && bcryptjs.compareSync(req.body.password, userByUsername[0].password);
    if (!isValidLogin) {
      res.status(401).json({ message: "Geçersiz kriter" })
    }
    else {
      req.user = userByUsername[0];
      next();
    }

  } catch (error) {
    next(error);
  }
}


const rolAdiGecerlimi = (req, res, next) => {
  /*
    Bodydeki role_name geçerliyse, req.role_name öğesini trimleyin ve devam edin.

    Req.body'de role_name eksikse veya trimden sonra sadece boş bir string kaldıysa,
    req.role_name öğesini "student" olarak ayarlayın ve isteğin devam etmesine izin verin.

    Stringi trimledikten sonra kalan role_name 'admin' ise:
    status: 422
    {
      "message": "Rol adı admin olamaz"
    }

    Trimden sonra rol adı 32 karakterden fazlaysa:
    status: 422
    {
      "message": "rol adı 32 karakterden fazla olamaz"
    }
  */
  try {

    let { role_name } = req.body;

    if (!role_name || role_name.trim() === "") {
      role_name = "student";
    }
    else if (role_name.trim() === "admin") {
      res.status(422).json({ message: "Rol adı admin olamaz" });
      return;
    }
    else if (!role_name.trim().length > 32) {
      res.status(422).json({ message: "Rol adı 32 karakterden gazla olamaz" });
      return;
    }

    req.body.role_name = role_name;
    req.body.password = bcryptjs.hashSync(req.body.password);
    next();

  } catch (error) {
    next(error)
  }
}

module.exports = {
  sinirli,
  usernameVarmi,
  rolAdiGecerlimi,
  sadece,
}
