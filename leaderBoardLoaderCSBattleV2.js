(() => {
const apiKey = 'AIzaSyCdMprYvMXK3ZyuHgXMW9KyzmUcBudzyjI';
const spreadsheetId = '1rHFrCjR92zW5dI06Ug7LbSxBmtbGXcsSpEvuOQeUrEY';
const range = 'CsbattleLeaderboard!A1:J100';

// Enddatum übergeben
//const spreadsheetIdDate = '1mTFOskVbQb1oHVRPdfgqhHju7zfKa5ld4C6BSdSXlv4';
//const rangeDate = 'Enddate!A1:A1';

// Preisliste nach Platzierung
const prizeDistribution = [250, 100, 75, 35, 20, 10, 10]; // Preise für die Plätze 1-7 (Platz 8 und höher = 0)

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
    setTimeout(() => {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range
    }).then((response) => {
        const data = response.result.values;
        if (data.length > 0) {
            const headers = data[0];  
            let filteredData = data.slice(1).map(row => [
                row[0],  // userRank
                row[1],  // userID
                row[2],  // UserName
                row[3],  // Useravatar URL
                parseFloat(row[4]) || 0,  // Wagered (Wichtig für Platzierung)
                parseFloat(row[5]) || 0,  // price
                row[6]  // EndDate               
            ]);


            // Spieler mit 0 Wagered entfernen
            filteredData = filteredData.filter(row => row[4] !== 0);

            // Sortieren nach Wagered (höchster Wert zuerst)
            filteredData.sort((a, b) => b[4] - a[4]);

            // Platzierungen vergeben + Preise zuweisen
            filteredData = filteredData.map((row, index) => {
            //    let prize = prizeDistribution[index] || 0;  // Falls Platz > 7 → 0 als Preis setzen
                return [...row, index + 1]; // Platz & fixen Preis hinzufügen
            });

            console.log("Sortierte Daten mit Platzierungen & Preisen:", filteredData);

            // Top 3 anzeigen
            displayTopThreeInBoxes(filteredData.slice(0, 3));
            displayAllParticipants(filteredData.slice(3));

           // Hier den Countdown mit dem Enddatum starten
           console.log("Gefundenes Enddatum Csbattle:", filteredData[0][6]);
            if (filteredData.length > 0 && filteredData[0][6]) {
                console.log("Gefundenes Enddatum csbattle:", filteredData[0][6]); // Debugging
                startCountdown(filteredData[0][6]);  // Das Enddatum von Platz 1 verwenden
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

// Die ersten drei Teilnehmer in Kacheln anzeigen
function displayTopThreeInBoxes(topThree) {
    const loader = document.getElementById('loader-csbattle');
    const container = document.getElementById('top-tiles-csbattle');

    if(loader) loader.style.display = 'none';
    if(container) container.style.display = 'flex';

    if (!container) {
        console.error('Container with id "top-tiles" not found.');
        return;
    }
        console.log("Top Three Data:", topThree); // Debugging-Ausgabe
    container.innerHTML = ''; // Vorherige Inhalte löschen

    topThree.forEach((player, index) => {
        const box = document.createElement('div');
        box.classList.add('tile');
        // Positionierungsklassen hinzufügen
        if (index === 1) {
            box.classList.add('second');
            placementText = "2nd";
        }else if (index === 0){
         box.classList.add('first');
         placementText = "1st";
        }else if (index === 2){
            box.classList.add('third');
            placementText = "3rd";
        }

        // player Array Struktur (Beispiel): [Name, Rang, Preis, Wagered, BildURL]
        // Entsprechend anpassen, falls anders

        box.innerHTML = `
            <img src="${player[3]}" onerror="this.onerror=null; this.src='images/CryderLogoSpin.gif';" 
            alt="Alternative image"/>
            <div class="player-name">${player[2]}</div>
            <div class="info-label">WAGERED</div>
            <div class="info-value">
                <span class="clashcoin-icon-small"></span>
                 ${player[4]}
            </div>
            <div class="info-label">PRIZE</div>
            <div class="prize">
                <span class="clashcoin-icon-big"></span> ${player[5]}
            </div>
            <div class="placement">${placementText}</div>
        `;

        container.appendChild(box);
    });
}

// Alle Teilnehmer in Tabelle anzeigen
function displayAllParticipants(participants) {
    const table = document.getElementById('sheet-table-csbattle');

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
                <td><img class="table-avatar" src="${row[3]}" onerror="this.onerror=null; this.src='images/CryderLogoSpin.gif';" 
            alt="Alternative image"/>${row[2]}</td>
                <td><img class="coin" src="/images/csbattleCoin.svg" /> ${row[4]}
                </td>
                <td><img class="coin" src="/images/csbattleCoin.svg" /> ${row[5]}
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

// Timer für Countdown
function startCountdown(targetDate) {
    const countdownElement = document.getElementById("countdown-csbattle");

    function updateCountdown() {
        const now = new Date().getTime();
        const targetTime = new Date(targetDate).getTime();
        const timeRemaining = targetTime - now;

        if (timeRemaining <= 0) {
            countdownElement.innerHTML = "Zeit abgelaufen!";
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
    const interval = setInterval(updateCountdown, 1000);
}
})();