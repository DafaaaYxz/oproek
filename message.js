const chalk = require("chalk");
const fs = require("fs");
const path = require('path');
const util = require("util");
const os = require('os');
const { exec, spawn, execSync } = require('child_process');
const { prepareWAMessageMedia, generateWAMessageFromContent } = require("@skyzopedia/baileys-mod");
const { uploadImageBuffer, CatBox } = require("./lib/skrep.js")
const fakeQuoted = require("./lib/fakequoted.js")
global.db = global.db ? global.db : JSON.parse(fs.readFileSync("./collection/database.json"))

const RefreshDb = async (dt) => {
global.db = dt
await fs.writeFileSync("./collection/database.json", JSON.stringify(global.db, null, 2))
}

//==================================//

module.exports = async (sock, m) => {
try {
const isCmd = m?.body?.startsWith(m.prefix)
const quoted = m.quoted ? m.quoted : m
const mime = quoted?.msg?.mimetype || quoted?.mimetype || null
const args = m?.body?.trim().split(/ +/).slice(1)
const qmsg = (m.quoted || m)
const text = q = args.join(" ")
const command = isCmd ? m.body.slice(m.prefix.length).trim().split(' ').shift().toLowerCase() : ''
const cmd = m.prefix + command
const botNumber = await sock.user.id.split(":")[0]+"@s.whatsapp.net"
const isOwner = global.owner == m.sender.split("@")[0] || m.sender == botNumber
  m.isGroup = m.chat.endsWith('g.us');
  m.metadata = {};
  m.isAdmin = false;
  m.isBotAdmin = false;
  if (m.isGroup) {
    let meta = await global.groupMetadataCache.get(m.chat)
    if (!meta) meta = await sock.groupMetadata(m.chat).catch(_ => {})
    m.metadata = meta;
    const p = meta?.participants || [];
    m.isAdmin = p?.some(i => (i.id === m.sender || i.jid === m.sender) && i.admin !== null);
    m.isBotAdmin = p?.some(i => (i.id === botNumber || i.jid == botNumber) && i.admin !== null);
  } 
  
//==================================//

if (isCmd) {
console.log(chalk.white("• Sender  :"), chalk.blue(m.chat) + "\n" + chalk.white("• Group :"), chalk.blue(m.isGroup ? m.metadata.subject : "false") + "\n" + chalk.white("• Command :"), chalk.blue(cmd) + "\n")
}

//==================================//

if (db.antilink.includes(m.chat)) {
    try {
    const textMessage = m.text || ""
    const groupInviteLinkRegex = /(https?:\/\/)?(www\.)?chat\.whatsapp\.com\/[A-Za-z0-9]+(\?[^\s]*)?/gi
    const links = textMessage.match(groupInviteLinkRegex)
    if (links && !isOwner && !m.isAdmin && m.isBotAdmin) {
        const messageId = m.key.id
        const participantToDelete = m.key.participant || m.sender
        await sock.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: messageId,
                participant: participantToDelete
            }
        })
    }
    } catch (er) {}
}

//==================================//

if (db.autopromosi?.status && m.isGroup && !isOwner) {
    try {
    await sleep(4000)
    const promoText = db.autopromosi?.text || ""
    const promoImage = db.autopromosi?.image || ""
    if (promoImage) {
        await sock.sendMessage(m.chat, {
            image: promoImage,
            caption: promoText
        })
    } 
    else if (promoText) {
        await sock.sendMessage(m.chat, { text: promoText })
    }
    } catch (er) {}
}

//==================================//

if (db.list && db.list[m?.text?.toLowerCase()]) {
    const data = db.list[m.text.toLowerCase()]
    const respon = data.response || ""
    if (data.image) {
        return sock.sendMessage(m.chat, { 
            image: { url: data.image }, 
            caption: respon 
        }, { quoted: m })
    } else {
        return m.reply(respon)
    }
}

//==================================//

if (m.isGroup && db.pconly && !isOwner) return
if (!m.isGroup && db.grouponly && !isOwner) return

//==================================//

switch (command) {
case "menu": {
  const img = JSON.parse(fs.readFileSync("./collection/thumbnail.json"))
  let teks = `
Hii @${m.sender.split("@")[0]} 🕊️
I'am Based WhatsApp Bot Latest Baileys Version by Skyzopedia!

ISI STYLE DAN MENU ANDA
`;

  let msg = await generateWAMessageFromContent(m.chat, {
    viewOnceMessage: {
        message: {
            interactiveMessage: {
                header: {
                    ...img,
                    hasMediaAttachment: true
                },
                body: { 
                    text: teks 
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: "Contact Developer",
                                url: global.telegram,
                                merchant_url: global.telegram
                            })
                        }, 
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: "Contact Developer",
                                url: global.telegram,
                                merchant_url: global.telegram
                            })
                        }
                    ],
                    messageParamsJson: JSON.stringify({
                        limited_time_offer: {
                            text: global.botname,
                            url: global.telegram,
                            copy_code: "1",
                            expiration_time: 0
                        },
                        bottom_sheet: {
                            in_thread_buttons_limit: 2,
                            divider_indices: [1, 2, 3, 4, 5, 999],
                            list_title: "skyzopedia",
                            button_title: "skyzopedia"
                        },
                        tap_target_configuration: {
                            title: "1",
                            description: "bomboclard",
                            canonical_url: global.telegram,
                            domain: "shop.example.com",
                            button_index: 0
                        }
                    })
                },
                contextInfo: {
                    mentionedJid: [m.sender]
                }
            }
        }
    }
}, { 
    userJid: m.sender,
    quoted: fakeQuoted.ai
});

await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break

case "setthumb": case "setimg": case "setthumbnail": {
if (!/image/.test(mime)) return m.reply(`Reply atau kirim foto dengan ketik ${cmd}`)
let images = m.quoted ? await m.quoted.download() : await m.download()
let aa = await prepareWAMessageMedia({ image: images }, { upload: sock.waUploadToServer })
await fs.writeFileSync("./collection/thumbnail.json", JSON.stringify(aa, null, 2))
return m.reply("Berhasil mengganti thumbail ✅")
}
break

//==================================//

default:
if (m.text.toLowerCase().startsWith("xx ")) {
  if (!isOwner) return;
  try {
    const r = await eval(`(async()=>{${text}})()`);
    sock.sendMessage(m.chat, { text: util.format(typeof r === "string" ? r : util.inspect(r)) }, { quoted: m });
  } catch (e) {
    sock.sendMessage(m.chat, { text: util.format(e) }, { quoted: m });
  }
}

if (m.text.toLowerCase().startsWith("x ")) {
  if (!isOwner) return;
  try {
    let r = await eval(text);
    sock.sendMessage(m.chat, { text: util.format(typeof r === "string" ? r : util.inspect(r)) }, { quoted: m });
  } catch (e) {
    sock.sendMessage(m.chat, { text: util.format(e) }, { quoted: m });
  }
}

if (m.text.startsWith('$ ')) {
  if (!isOwner) return;
  exec(m.text.slice(2), (e, out) =>
    sock.sendMessage(m.chat, { text: util.format(e ? e : out) }, { quoted: m })
  );
}}

//==================================//

} catch (err) {
console.log(err)
}
}

let file = require.resolve(__filename) 
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(chalk.white("• Update"), chalk.white(`${__filename}\n`))
delete require.cache[file]
require(file)
})
