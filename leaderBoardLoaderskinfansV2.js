(() => {
const apiKey = 'AIzaSyCdMprYvMXK3ZyuHgXMW9KyzmUcBudzyjI';
const spreadsheetId = '1g0hu6nylkjUAyBdcdn7yunuhifiSnsuxWVgCAE7x6zY';
const range = 'Leaderboard!A1:H100';

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
                row[0]+'Z',  // Enddate (wird später für Countdown benötigt)
                row[1],  // Position
                row[2],  // Price
                row[4],  // Name
                parseFloat(row[5]) || 0,  // Wagered (Wichtig für Platzierung)
                row[7],  // ImageURL
            ]);

            // Spieler mit 0 Wagered entfernen
            //filteredData = filteredData.filter(row => row[4] !== 0);

            // Sortieren nach Wagered (höchster Wert zuerst)
            filteredData.sort((a, b) => b[4] - a[4]);

            // Platzierungen vergeben + Preise zuweisen
            /*filteredData = filteredData.map((row, index) => {
                let prize = prizeDistribution[index] || 0;  // Falls Platz > 7 → 0 als Preis setzen
                return [...row, index + 1, prize]; // Platz & fixen Preis hinzufügen
            });*/

            console.log("Sortierte Daten mit Platzierungen & Preisen:", filteredData);

            // Top 3 anzeigen
            displayTopThreeInBoxes(filteredData.slice(0, 3));
            displayAllParticipants(filteredData.slice(3));

            // Enddatum aus dem Sheet ziehen
            startCountdown(filteredData[0][0]); // Annahme: Enddatum ist in der ersten Spalte (A) der ersten Zeile (1)
            gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetIdDate,
                range: rangeDate
            }).then((response) => {
                const dateData = response.result.values;
                if (dateData.length > 0) {
                    const date = dateData[0][0];  
                    console.log("Gefundenes Enddatum:", date); 
                    
                } else {
                    console.error('Kein Enddatum gefunden.');
                }
            }).catch(error => {
                console.error('Fehler beim Abrufen des Enddatums:', error);
                
            });
        } else {
            console.log('Keine Daten gefunden.');
            
        }
    }, (error) => {
        console.error('Fehler beim Abrufen der Daten:', error);
       
    });
}, 100); // 2000 Millisekunden (2 Sekunden) Wartezeit
}

// Die ersten drei Teilnehmer in Kacheln anzeigen
function displayTopThreeInBoxes(topThree) {
    const loader = document.getElementById('loader-skinfans');
    const container = document.getElementById('top-tiles-skinfans');

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
            <img src="${player[5]}" onerror="this.onerror=null; this.src='images/CryderLogoSpin.gif';" 
            alt="Alternative image"" />
            <div class="player-name">${player[3]}</div>
            <div class="info-label">WAGERED</div>
            <div class="info-value">
                <span class="skinfans-icon-small"></span>
                 ${player[4]}
            </div>
            <div class="info-label">PRIZE</div>
            <div class="prize">
                <span class="skinfans-icon-big"></span> ${player[2]}
            </div>
            <div class="placement">${placementText}</div>
        `;

        container.appendChild(box);
    });
}

// Alle Teilnehmer in Tabelle anzeigen
function displayAllParticipants(participants) {
    const table = document.getElementById('sheet-table-skinfans');

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
                <td><img class="table-avatar" src="${row[5]}" onerror="this.onerror=null; this.src='images/CryderLogoSpin.gif';" 
            alt="Alternative image"/>${row[3]}</td>
                <td><img class="coin" src="/images/skinfanscoin.svg" /> ${row[4]}
                </td>
                <td><img class="coin" src="/images/skinfanscoin.svg" /> ${row[2]}
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
    const countdownElement = document.getElementById("countdown-skinfans");

    function updateCountdown() {
        const now = new Date().getTime();
        const targetTime = new Date(targetDate).getTime();
        const timeRemaining = targetTime - now;

        if (timeRemaining <= 0) {
            countdownElement.innerHTML = "Times Over!";
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