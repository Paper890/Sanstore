const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

// Token bot Anda
const bot = new Telegraf('7360190308:AAH79nXyUiU4TRscBtYRLg14WVNfi1q1T1M');

// Path file database yang ada dan tujuan restore
const dbFilePath = '/root/BotVPN/sellvpn.db';  // Lokasi file sellvpn.db yang akan diganti

// Perintah untuk memulai proses restore
bot.command('restore', (ctx) => {
  ctx.reply('Silakan kirimkan file backup .db untuk di-restore.');
});

// Handle penerimaan file dari pengguna
bot.on('document', (ctx) => {
  const chatId = ctx.chat.id;
  const file = ctx.message.document;
  
  // Mendapatkan nama file dan memeriksa ekstensi file
  const fileName = file.file_name;
  const fileExtension = path.extname(fileName).toLowerCase();

  // Memeriksa apakah file yang diterima adalah file dengan ekstensi .db
  if (fileExtension === '.db') {
    // Mendapatkan file ID untuk mendownload file
    const fileId = file.file_id;

    // Mendapatkan URL file untuk diunduh
    ctx.telegram.getFileLink(fileId).then((fileLink) => {
      const fileUrl = fileLink;

      // Unduh file dan simpan ke lokasi yang ditentukan
      const https = require('https');
      const fileStream = fs.createWriteStream(dbFilePath);

      https.get(fileUrl, (response) => {
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          ctx.reply('File restore berhasil dilakukan dan disimpan sebagai sellvpn.db.');
        });

        fileStream.on('error', (err) => {
          ctx.reply(`Terjadi kesalahan saat mengunduh file: ${err.message}`);
        });
      });
    }).catch((error) => {
      ctx.reply(`Terjadi kesalahan saat memproses file: ${error.message}`);
    });
  } else {
    ctx.reply('Hanya file dengan ekstensi .db yang diperbolehkan. Kirimkan file dengan ekstensi .db untuk merestore.');
  }
});

// Jalankan bot
bot.launch();

console.log('Bot is running...');
