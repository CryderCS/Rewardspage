const apiKey = 'AIzaSyCdMprYvMXK3ZyuHgXMW9KyzmUcBudzyjI';  // Dein API-Schlüssel
const spreadsheetId = '1Jn95fuSVCESmd2riDKIGofFoqYCmd3KdQd-BYSn28-A';  // Deine Spreadsheet-ID
const range = 'Sheet1!A1:D100';  // Bereich A1 bis D100 (nur Spalten A, B, C, D)sdasdasdasdasda

// Google API initialisieren
function initApi() {
    gapi.client.init({
        'apiKey': apiKey,
        'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4']
    }).then(() => {
        // Google Sheets API aufrufen
        getSheetData();
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
            // Die erste Zeile als Überschrift verwenden
            const headers = data[0];  // Erste Zeile (Index 0) wird als Überschrift genommen

            // Nur die Spalten A (0), B (1), C (2) und D (3) extrahieren, ab der zweiten Zeile
            const filteredData = data.slice(1).map(row => [
                row[0],  // Spalte A
                row[1],  // Spalte B
                row[2],  // Spalte C
                row[3]   // Spalte D Datum
            ]);

            // Spaltenüberschriften in die Tabelle einfügen
            
            // Gefilterte Daten in die Tabelle einfügen
            displayTopThreeInBoxes(filteredData.slice(0, 3));
            displayAllParticipants(filteredData.slice(3))
            // Hier den Countdown mit dem Enddatum starten
            if (filteredData.length > 0 && filteredData[0][3]) {
                console.log("Gefundenes Enddatum:", filteredData[0][3]); // Debugging
                startCountdown(filteredData[0][3]);  // Das Enddatum von Platz 1 verwenden
            } else {
                console.error("Kein gültiges Enddatum gefunden.");
            }
        } else {
            console.log('Keine Daten gefunden.');
        }
    }, (error) => {
        console.error('Fehler beim Abrufen der Daten:', error);
    });
}

// Spaltenüberschriften in die HTML-Tabelle einfügen
// Die ersten drei Teilnehmer in Kacheln anzeigen
function displayTopThreeInBoxes(topThree) {
    const container = document.getElementById('top-three-container');
    container.innerHTML = ''; // Vorherige Inhalte löschen

    topThree.forEach((row, index) => {
        const box = document.createElement('div');
        box.classList.add('participant-box-roll');

        // HTML-Inhalt für die Box erstellen
        box.innerHTML = `
            <h3>#${row[1]}</h3>
            <img src="/images/CSGOROLL_Logo.png" alt="ProfilePic" style="width: auto; height: 50px">
            <p class="participant-name"><strong>${row[0]}</strong></p>
            <p>Tickets:</p>
            <p><strong>${row[2]}</strong> </p>
        `;

        // Boxen positionieren
        if (index === 0) {
            box.classList.add('top-box');  // Erste Box oben in der Mitte
        } else if (index === 1) {
            box.classList.add('left-box');  // Zweite Box links und leicht unterhalb
        } else if (index === 2) {
            box.classList.add('right-box');  // Dritte Box rechts und leicht unterhalb
        }

        container.appendChild(box);
    });
}
function displayAllParticipants(participants) {
    const tbody = document.getElementById('sheet-table').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; // Vorherige Inhalte löschen

    participants.forEach((row, index) => {
        const tr = document.createElement('tr');

        // Eine Zeile mit den jeweiligen Daten
        tr.innerHTML = `
            <td>${row[1]}</td> 
            <td>${row[0]}</td> 
            <td>Tickets: <strong>${row[2]}</strong></td>
            `//<td><img src="${row[4]}" alt="Avatar" class="participant-avatar" style="width: 50px; height: 50px; border-radius: 50%;"></td> <!-- Avatar -->
        ;

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
    const countdownElement = document.getElementById("countdown");

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

        countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 100);
}
