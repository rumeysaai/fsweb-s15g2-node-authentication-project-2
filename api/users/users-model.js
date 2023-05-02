const db = require('../../data/db-config.js');

async function bul() {
  /**
    2 tabloyu birleştirmeniz lazım (join)
    Tüm kullanıcılar DİZİSİNİ çözümlemeli

    [
      {
        "user_id": 1,
        "username": "bob",
        "role_name": "admin"
      },
      {
        "user_id": 2,
        "username": "sue",
        "role_name": "instructor"
      }
    ]
   */
  const users = await db('users as u')
        .leftJoin('roles as r', 'u.role_id', 'r.role_id')
        .select('u.user_id', 'u.username', 'r.role_name');
  return users;
}

async function goreBul(filtre) {
  /**
    2 tabloyu birleştirmeniz gerekiyor
    Filtreyle eşleşen kullanıcıları içeren DİZİYİ çözümlemeli

    [
      {
        "user_id": 1,
        "username": "bob",
        "password": "$2a$10$dFwWjD8hi8K2I9/Y65MWi.WU0qn9eAVaiBoRSShTvuJVGw8XpsCiq",
        "role_name": "admin",
      }
    ]
   */

  const users = await db('users as u').select('u.user_id', 'u.username', 'u.password', 'r.role_name')
              .leftJoin('roles as r', 'u.role_id', 'r.role_id')
              .where(filtre);

  return users;

}

async function idyeGoreBul(user_id) {
  /**
    2 tabloyu birleştirmeniz gerekiyor
    Verilen id li kullanıcıyı çözümlemeli

    {
      "user_id": 2,
      "username": "sue",
      "role_name": "instructor"
    }
   */

  const user = await db('users as u').select('u.user_id', 'u.username', 'r.role_name')
            .leftJoin('roles as r', 'u.role_id', 'r.role_id')
            .where('user_id',user_id);

  return user;
}

/**
  Kullanıcı oluşturmak için tek bir insert varsa (users tablosuna) eğer verilen role_name db'de mevcutsa
  ya da 2 insert varsa (önce roles ve sonra users tablosuna)
  role_name dbde kayıtlı değilse.

  Kullanıcı oluşturmak gibi bir işlem birden fazla tabloya veri ekliyorsa,
  tüm operasyonların başarılı veya başarısız olmasını isteriz. Eğer yeni role eklenemezse
  kullanıcı eklemesinin de başarısız olması gerekir.

  Bu gibi durumlarda şu işlemleri kullanırız: işlemin içindeki herhangi birisi başarısız olursa,
  tüm veritabanı içindeki değişiklikler geri alınır

  {
    "user_id": 7,
    "username": "anna",
    "role_name": "team lead"
  }
 */
async function ekle({ username, password, role_name }) { // bu kısım hazır
  let created_user_id
  await db.transaction(async trx => {
    let role_id_to_use
    const [role] = await trx('roles').where('role_name', role_name)
    if (role) {
      role_id_to_use = role.role_id
    } else {
      const [role_id] = await trx('roles').insert({ role_name: role_name })
      role_id_to_use = role_id
    }
    const [user_id] = await trx('users').insert({ username, password, role_id: role_id_to_use })
    created_user_id = user_id
  })
  return idyeGoreBul(created_user_id)
}

module.exports = {
  ekle,
  bul,
  goreBul,
  idyeGoreBul,
};
