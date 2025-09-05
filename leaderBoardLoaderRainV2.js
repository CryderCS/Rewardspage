// leaderBoardLoaderRainV2.js
(() => {
  const apiKey = 'AIzaSyCdMprYvMXK3ZyuHgXMW9KyzmUcBudzyjI'; // Dein API-Schlüssel
    const spreadsheetId = '1kuB0dSv0yobxIxjq3laApPlqB1WN7cAsGxceLmWN7So'; // Dein Spreadsheet-ID (ersetze dies)
    const range = 'Sheet1!A1:K100'; // Bereich in deinem Google Sheet

// Google API initialisieren
function initApi() {
    gapi.client.init({
        'apiKey': apiKey,
        'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4']
    }).then(() => {
        // Nach erfolgreicher Initialisierung das Sheet anpingen und dann Daten abrufen
        pingSheetBeforeFetching();
    }).catch((error) => {
        console.error('Fehler bei der Initialisierung der API:', error);
    });
}

// Funktion zum Anpingen des Sheets
function pingSheetBeforeFetching() {
    // Anpingen des Sheets, um sicherzustellen, dass es bereit ist
    gapi.client.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId
    }).then(() => {
        // Wartezeit einfügen, um sicherzustellen, dass das Sheet bereit ist
        setTimeout(() => {
            // Daten abrufen, nachdem das Sheet bereit ist
            getSheetData();
        }, 1000); // 2000 Millisekunden (2 Sekunden) Wartezeit
    }).catch((error) => {
        console.error('Fehler beim Anpingen des Sheets:', error);
    });
}

// Laden der Google Sheets-Daten
function getSheetData() {
    // Warte 2 Sekunden bevor du die Daten abruft
    setTimeout(() => {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: range
        }).then((response) => {
            const data = response.result.values;
            if (data.length > 0) {
                // Nur die Spalten C (2), D (3), F (5) und G (6) extrahieren, ab der zweiten Zeile 
                const filteredData = data.slice(1).map(row => [
                    row[2],  // Spalte C Name
                    row[3],  // Spalte D Rang
                    formatNumber(row[5]),  // Spalte F mit Formatierung Price
                    row[6],   // Spalte G wagered
                    row[7],     //Avatar
                    row[9],      //Enddatum
                    row[10] // Cashback
                ]);

                // Die ersten drei Ergebnisse in Kacheln anzeigen
                displayTopThreeInBoxes(filteredData.slice(0, 3));
                displayAllParticipants(filteredData.slice(3));
                // Hier den Countdown mit dem Enddatum starten
            if (filteredData.length > 0 && filteredData[0][5]) {
                console.log("Gefundenes Enddatum:", filteredData[0][5]); // Debugging
                startCountdown(filteredData[0][5]);  // Das Enddatum von Platz 1 verwenden
            } else {
                console.error("Kein gültiges Enddatum gefunden.");
            }
            } else {
                console.log('Keine Daten gefunden.');
            }
        }).catch((error) => {
            console.error('Fehler beim Abrufen der Daten:', error);
        });
    }, 100); // 2000 Millisekunden (2 Sekunden) Wartezeit
}


function displayTopThreeInBoxes(topThree) {
    const loader = document.getElementById('loader-rain');
    const container = document.getElementById('top-tiles-rain');

    if(loader) loader.style.display = 'none';
    if(container) container.style.display = 'flex';

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
            <img src="${player[4]}" alt="Player ${index + 1}" />
            <div class="player-name">${player[0]}</div>
            <div class="info-label">WAGERED</div>
            <div class="info-value">
                <span class="raincoin-icon-small"></span>
                 ${player[3]}
            </div>
            <div class="info-label">PRIZE</div>
            <div class="prize">
                <span class="raincoin-icon-big"></span> ${player[2]}
            </div>
        `;

        container.appendChild(box);
    });
}
function displayAllParticipants(participants) {
    const table = document.getElementById('sheet-table-rain');

    console.log("DEBUG var:", table);
    console.log("Type:", typeof table);

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
                <td class="position">${row[1]}</td>
                <td><img class="table-avatar" src="${row[4]}" onerror="this.onerror=null; this.src='images/CryderLogoSpin.gif';" 
            alt="Alternative image"/>${row[0]}</td>
                <td><img class="coin" src="/images/Raincoin.svg" /> ${row[3]}
                </td>
                <td><img class="coin" src="/images/Raincoin.svg" /> ${row[2]}
                </td>
        `;

        tbody.appendChild(tr);
    });
}
// Funktion zum Formatieren der Zahlen (z.B. 14000 zu 140.00)
function formatNumber(value) {
    if (!isNaN(value)) {
        return (parseFloat(value) / 100).toFixed(2); // Wert durch 100 teilen und auf 2 Dezimalstellen formatieren
    }
    return value; // Falls der Wert kein numerischer Wert ist, bleibt er unverändert
}

// API laden und initialisieren
function loadApi() {
    gapi.load('client', initApi);
}

// STARTE API sofort, damit Rain beim Seitenladen geladen wird
loadApi();

//Timer 
function startCountdown(targetDate) {
    const countdownElement = document.getElementById("countdown-rain");

    function updateCountdown() {
        const now = new Date().getTime();
        const targetTime = new Date(targetDate).getTime();
        const timeRemaining = targetTime - now;

        if (timeRemaining <= 0) {
            countdownElement.innerHTML = "Times up!";
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

})();
