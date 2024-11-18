// Fungsi untuk membuat kode voucher
function generateVoucherCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const smallLetters = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";

  const getRandomChar = (source) =>
    source.charAt(Math.floor(Math.random() * source.length));

  return (
    getRandomChar(letters) +
    getRandomChar(letters) +
    getRandomChar(smallLetters) +
    getRandomChar(smallLetters) +
    getRandomChar(numbers) +
    getRandomChar(numbers) +
    getRandomChar(numbers)
  );
}

// Fungsi memastikan user di database
function ensureUser(userId, callback) {
  db.run(
    `INSERT OR IGNORE INTO users (user_id) VALUES (?)`,
    [userId],
    (err) => {
      if (err) {
        console.error("Kesalahan memastikan user:", err.message);
      }
      callback();
    }
  );
}

// Fungsi admin untuk membuat kode voucher
bot.command("create_voucher", (ctx) => {
  const args = ctx.message.text.split(" ");
  const isAdmin = ctx.from.id === 576495165; // Ganti dengan Telegram ID admin Anda

  if (!isAdmin) {
    return ctx.reply(
      "Anda tidak memiliki izin untuk menggunakan perintah ini."
    );
  }

  if (args.length < 4) {
    return ctx.reply(
      "Format: /create_voucher <manual|auto> <jumlah|kode> <saldo>. Contoh:\n- /create_voucher manual KODE123 5000\n- /create_voucher auto 5 1000"
    );
  }

  const type = args[1];
  const input = args[2];
  const value = parseInt(args[3]);

  if (type === "manual") {
    const code = input;
    db.run(
      `INSERT INTO vouchers (code, value, created_by) VALUES (?, ?, ?)`,
      [code, value, ctx.from.id],
      (err) => {
        if (err) {
          console.error("Kesalahan membuat kode voucher:", err.message);
          ctx.reply(
            "Gagal membuat kode voucher. Pastikan kode tidak duplikat."
          );
        } else {
          ctx.reply(
            `Kode voucher "${code}" berhasil dibuat dengan saldo ${value}.`
          );
        }
      }
    );
  } else if (type === "auto") {
    const quantity = parseInt(input);
    if (isNaN(quantity) || quantity <= 0) {
      return ctx.reply("Jumlah voucher harus berupa angka positif.");
    }

    const vouchers = [];
    for (let i = 0; i < quantity; i++) {
      vouchers.push([generateVoucherCode(), value, ctx.from.id]);
    }

    const placeholders = vouchers.map(() => "(?, ?, ?)").join(", ");
    const flatValues = vouchers.flat();

    db.run(
      `INSERT INTO vouchers (code, value, created_by) VALUES ${placeholders}`,
      flatValues,
      (err) => {
        if (err) {
          console.error(
            "Kesalahan membuat kode voucher otomatis:",
            err.message
          );
          ctx.reply("Terjadi kesalahan saat membuat voucher otomatis.");
        } else {
          ctx.reply(
            `${quantity} kode voucher berhasil dibuat masing-masing dengan saldo ${value}.`
          );
        }
      }
    );
  } else {
    ctx.reply("Tipe voucher tidak valid. Gunakan 'manual' atau 'auto'.");
  }
});

// Fungsi Ambil kode Voucher
// Event untuk menangkap teks yang dikirim oleh pengguna
bot.on("text", (ctx) => {
  const messageText = ctx.message.text.trim();
  const userId = ctx.from.id;

  // Pastikan pengguna ada di database sebelum melanjutkan
  ensureUser(userId, () => {
    db.get(
      `SELECT * FROM vouchers WHERE code = ?`,
      [messageText],
      (err, voucher) => {
        if (err) {
          console.error("Kesalahan mengambil kode voucher:", err.message);
          return ctx.reply("Terjadi kesalahan saat memproses permintaan Anda.");
        }

        if (!voucher) {
          // Kode voucher tidak ditemukan
          return ctx.reply("Command Tidak Tersedia.");
        }

        // Tambahkan saldo pengguna dan hapus voucher
        db.run(
          `UPDATE users SET saldo = saldo + ? WHERE user_id = ?`,
          [voucher.value, userId],
          (err) => {
            if (err) {
              console.error("Kesalahan memperbarui saldo:", err.message);
              return ctx.reply("Terjadi kesalahan saat menambahkan saldo.");
            }

            db.run(`DELETE FROM vouchers WHERE id = ?`, [voucher.id], (err) => {
              if (err) {
                console.error("Kesalahan menghapus voucher:", err.message);
                return ctx.reply(
                  "Saldo telah ditambahkan, tetapi terjadi kesalahan saat menghapus voucher."
                );
              }

              ctx.reply(
                `Saldo sebesar ${voucher.value} berhasil ditambahkan ke akun Anda!`
              );
            });
          }
        );
      }
    );
  });
});
