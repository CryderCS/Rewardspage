const apiKey = 'AIzaSyCdMprYvMXK3ZyuHgXMW9KyzmUcBudzyjI'; // Dein API-Schlüssel
const spreadsheetId = '1mTFOskVbQb1oHVRPdfgqhHju7zfKa5ld4C6BSdSXlv4'; // Dein Spreadsheet-ID (ersetze dies)
const range = 'Sheet1!A1:H100'; // Bereich in deinem Google Sheet

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
                    row[0],  // Spalte D Rang
                    formatNumber(row[5]),  // Spalte F mit Formatierung Price
                    row[4],   // Spalte G wagered
                    row[2],     //Avatar
                    row[9]      //Enddatum
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


// Die ersten drei Teilnehmer in Kacheln anzeigen
function displayTopThreeInBoxes(topThree) {
    const container = document.getElementById('top-three-container');
    container.innerHTML = ''; // Vorherige Inhalte löschen

    topThree.forEach((row, index) => {
        const box = document.createElement('div');
        box.classList.add('participant-box');

        // HTML-Inhalt für die Box erstellen
        box.innerHTML = `
            <h3>#${row[1]}</h3>
            <img src="${row[4]}" alt="ProfilePic" class="participant-avatar">
            <p class="participant-name"><strong>${row[0]}</strong></p>
            <p>Prize:</p>
            <p><img src="/images/RainCoin.png" alt="Rollcoin" style="width: 19px; height: 19px"><strong>${row[2]}</strong> </p>
            <p>Wagered:</p>
            <p><strong>${row[3]}</strong> </p>
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
        <td>${row[1]}</td> <!-- Position (ab 1. Platz) -->
        <td>
            <img src="${row[4]}" alt="Avatar" style="width: 19px; height: 19px; border-radius: 50%; margin-right: 5px;">
            ${row[0]}
        </td> <!-- Username -->
        <td>${row[3]}</td> <!-- Prize -->
        <td>
            <img src="/images/RainCoin.png" alt="Rollcoin" style="width: 19px; height: 19px; margin-right: 5px;">
            ${row[2]}
        </td> <!-- Wagered -->
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

// Starte das Laden der API, wenn die Seite vollständig geladen ist
document.addEventListener('DOMContentLoaded', loadApi);

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
