(() => {    

const apiKey = 'AIzaSyCdMprYvMXK3ZyuHgXMW9KyzmUcBudzyjI';  // Dein API-Schlüssel
const spreadsheetId = '1Jn95fuSVCESmd2riDKIGofFoqYCmd3KdQd-BYSn28-A';  // Deine Spreadsheet-ID
const range = 'NewLeaderboard!A1:G100';  // Bereich
//Endatum übergeben
const spreadsheetIdDate = '1Jn95fuSVCESmd2riDKIGofFoqYCmd3KdQd-BYSn28-A';  // Deine Spreadsheet-ID
const rangeDate = 'EndDate!A1:A1';  // Bereich

let totalAmmount = 0;  // Gesamtbetrag



// Google API initialisieren
function initApi() {
    gapi.client.init({
        'apiKey': apiKey,
        'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4']
    }).then(() => {
        getSheetData();  // Google Sheets API abrufen
    });
}

// Laden der Google Sheets-Daten
function getSheetData() {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range
    }).then((response) => {
        const data = response.result.values;
        if (data.length > 0) {
            const headers = data[0];  // Spaltenüberschriften
            let filteredData = data.slice(1).map(row => [
                row[0],   // Spalte A ID
                row[1],   // Spalte B NAME
                Math.round((parseFloat(row[2]) || 0) * 100) / 100,   // Spalte C WAGER
                parseFloat(row[3]) || 0,  // Spalte D (Wert umwandeln in Float) COMISSION
                row[4],   // Spalte E
                row[5],   // Spalte F
                row[6]   // Spalte G
            ]);

            // 0 Deposit entfernen
            filteredData = filteredData.filter(row => row[2] !== 0);

            // Gesamtbetrag berechnen
            let totalAmmount = filteredData.reduce((sum, row) => sum + row[3], 0);
            console.log("Gesamtbetrag:", totalAmmount);
            
            // Total Amount anzeigen
            document.getElementById("totalAmountDisplay").innerText = 
            `Total Ammount: ${totalAmmount.toLocaleString()}`;

            // Sortieren nach Spalte D (größter Wert zuerst)
            filteredData.sort((a, b) => b[2] - a[2]);

            // Platzierungen vergeben 
            filteredData = filteredData.map((row, index) => [...row, index + 1]);

            console.log("Sortierte Daten mit Platzierungen:", filteredData);

            // Platzierungen vergeben & Bonus berechnen
            const bonusDistribution = [0.5, 0.2, 0.15, 0.06, 0.06, 0.03]; // Bonus für die Plätze 1-6
            filteredData = filteredData.map((row, index) => {
                let bonus = 0;
                if (index < bonusDistribution.length) {
                    bonus = totalAmmount * bonusDistribution[index]; // Prozentualer Anteil berechnen
                }
                return [...row, index + 1, bonus.toFixed(2)]; // Platzierung & Bonus als neue Spalten
            });
            console.log("Gefilterte und sortierte Daten mit Platzierungen & Boni:", filteredData);
            // Top 3 anzeigen
            displayTopThreeInBoxes(filteredData.slice(0, 3));
            displayAllParticipants(filteredData.slice(3));
            
            // Enddatum für Countdown aus Blatt ziehen
            gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetIdDate,
                range: rangeDate
            }).then((response) => {
                const dateData = response.result.values;
                let date = null; // Variable außerhalb der Funktion definieren
            
                if (dateData.length > 0) {
                    date = dateData[0][0];  // Korrekte Schreibweise
                } else {
                    console.error('Kein Enddatum gefunden.');
                }
            
                // Countdown starten (muss hier im Callback sein!)
                if (filteredData.length > 0 && date) {
                    console.log("Gefundenes Enddatum:", date); 
                    startCountdown(date);  
                } else {
                    console.error("Kein gültiges Enddatum gefunden.");
                }
            }).catch(error => {
                console.error('Fehler beim Abrufen des Enddatums:', error);
            });} else {
            console.log('Keine Daten gefunden.');
        }
    }, (error) => {
        console.error('Fehler beim Abrufen der Daten:', error);
    });
    

}

// Spaltenüberschriften in die HTML-Tabelle einfügen
// Die ersten drei Teilnehmer in Kacheln anzeigen
function displayTopThreeInBoxes(topThree) {
    const loader = document.getElementById('loader-csgoroll');
    const container = document.getElementById('top-tiles-csgoroll');

    if(loader) loader.style.display = 'none';
    if(container) container.style.display = 'flex';

    container.innerHTML = ''; 
    
    if (!container) {
        console.error('Container with id "top-tiles" not found.');
        return;
    }
    container.innerHTML = ''; // Vorherige Inhalte löschen

    topThree.forEach((player, index) => {
        const box = document.createElement('div');
        box.classList.add('tile');
        // Positionierungsklassen hinzufügen
        if (index === 1) box.classList.add('second');
        else if (index === 0) box.classList.add('first');
        else if (index === 2) box.classList.add('third');

        // player Array Struktur (Beispiel): [Name, Rang, Preis, Wagered, BildURL]
        // Entsprechend anpassen, falls anders

        box.innerHTML = `
            <img src="images/CryderLogoSpin.gif" onerror="this.onerror=null; this.src='images/CryderLogoSpin.gif';" 
            alt="Alternative image" />
            <div class="player-name">${player[1]}</div>
            <div class="info-label">WAGERED</div>
            <div class="info-value">
                <span class="csgorollcoin-icon-small"></span>
                 ${player[2]}
            </div>
            <div class="info-label">PRIZE</div>
            <div class="prize">
                <span class="csgorollcoin-icon-big"></span> ${player[9]}
            </div>
        `;

        container.appendChild(box);
    });
}
function displayAllParticipants(participants) {
    const table = document.getElementById('sheet-table-csgoroll');

    // Thead erzeugen oder leeren
    let thead = table.getElementsByTagName('thead')[0];
    if (!thead) {
        thead = table.createTHead();
    }
    thead.innerHTML = `
        <tr>
            <th class="position">#</th>
            <th>CONTESTANTS</th>
            <th>WAGERED</th>
            <th>PRIZE</th>
        </tr>
    `;

    // Tbody erzeugen oder leeren
    let tbody = table.getElementsByTagName('tbody')[0];
    if (!tbody) {
        tbody = table.createTBody();
    }
    tbody.innerHTML = ''; // Vorherige Inhalte löschen

    participants.forEach((row, index) => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
                <td class="position">${row[7]}</td>
                <td><img class="table-avatar" src="images/CryderLogoSpin.gif" onerror="this.onerror=null; this.src='images/CryderLogoSpin.gif';" 
            alt="Alternative image" />${row[1]}</td>
                <td><img class="coin" src="/images/csgorollcoin.webp" /> ${row[2]}
                </td>
                <td><img class="coin" src="/images/csgorollcoin.webp" /> ${row[9]}
                </td>
        `;

        tbody.appendChild(tr);
    });
}

// API laden und initialisieren
function loadApi() {
    gapi.load('client', initApi);
}

// Starte das Laden der API
loadApi();
//Timer 
function startCountdown(targetDate) {
    const countdownElement = document.getElementById("countdown-csgoroll");

    function updateCountdown() {
        const now = new Date().getTime();
        const targetTime = new Date(targetDate).getTime();
        const timeRemaining = targetTime - now;

        if (timeRemaining <= 0) {
            countdownElement.innerHTML = "Times over!";
            clearInterval(interval);
            return;
        }

        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `Leaderboard Ends In:<br/ > <span style="font-size: 24px;">${String(days).padStart(2,"0")} : ${String(hours).padStart(2,"0")} : ${String(minutes).padStart(2,"0")} : ${String(seconds).padStart(2,"0")}</span>`;
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 100);
}
// Bonusverteilung
/*const bonusDistribution = [
    { platz: "1. Place", prozent: "50%" },
    { platz: "2. Place", prozent: "20%" },
    { platz: "3. Place", prozent: "15%" },
    { platz: "4. Place", prozent: "6%" },
    { platz: "5. Place", prozent: "6%" },
    { platz: "6. Place", prozent: "3%" }
];

// Tabelle füllen
function createBonusTable() {
    const tableBody = document.querySelector("#bonusTable tbody");
    bonusDistribution.forEach(entry => {
        let row = document.createElement("tr");
        row.innerHTML = `<td>${entry.platz}</td><td>${entry.prozent}</td>`;
        tableBody.appendChild(row);
    });
}


// Wenn das DOM geladen ist, Tabelle erstellen
document.addEventListener("DOMContentLoaded", createBonusTable);
*/

})();
