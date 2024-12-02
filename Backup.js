bot.command("redeem", (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply("Harap masukkan kode voucher. Contoh: /redeem KODE123");
  }

  const userId = ctx.from.id;
  const voucherCode = args[1];

  ensureUser(userId, () => {
    db.get(
      `SELECT * FROM vouchers WHERE code = ?`,
      [voucherCode],
      (err, voucher) => {
        if (err) {
          console.error("Kesalahan mengambil kode voucher:", err.message);
          return ctx.reply("Terjadi kesalahan saat memproses permintaan Anda.");
        }

        if (!voucher) {
          return ctx.reply("Kode voucher tidak valid.");
        }

        // Tambahkan saldo dan hapus voucher
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
