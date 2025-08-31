import KickLiveWS from "@pagoru/kick_live_ws";

const client = new KickLiveWS("cryderyt");

let entries = [];

client.on("CHAT", (msg) => {
  const username = msg.sender.username;
  const message = msg.content;

  if (message.toLowerCase().includes("Cryder")) {
    if (!entries.includes(username)) {
      entries.push(username);
      console.log(`${username} joined the lotto!`);
    }
  }
});
function pickWinner() {
  const winner = entries[Math.floor(Math.random() * entries.length)];
  console.log(`🎉 Winner is: ${winner}`);
  // You can update your HTML DOM here to show a cool effect
}